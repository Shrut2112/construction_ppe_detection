import cv2 as cv
import numpy as np
import torch
import torchreid
from torchvision import transforms
from ultralytics import YOLO
from deepface import DeepFace
from collections import Counter
import time
import os
from database.database import log_violation, register_new_worker
from reid_manger import embedding_model

# Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FACES_DIR = os.path.join(BASE_DIR, "storage", "faces")
ALERTS_DIR = os.path.join(BASE_DIR, "storage", "alerts")
MODEL_PATH = os.path.join(BASE_DIR, "model", "best (1).pt") 

os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs(ALERTS_DIR, exist_ok=True)

class PPEPipeline:
    def __init__(self):
        print("[INFO] Initializing PPE Pipeline (ReID Enhanced)...")
        self.model = YOLO(MODEL_PATH)
        self.class_names = self.model.names
        print(f"[INFO] Loaded YOLO classes: {self.class_names}")
        
        # Load ReID Model
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.reid_model, self.transform = embedding_model()
        self.reid_model.eval()
        self.reid_model.to(self.device)
        print(f"[INFO] ReID Model Loaded on {self.device}")

        # Configuration
        self.min_face_size = 40
        self.sharpness_threshold = 80
        self.wait_for_face_limit = 25
        self.model_name = "Facenet"
        self.person_conf_thresh = 0.5
        self.ppe_conf_thresh = 0.5
        
        # State
        self.cap = None
        self.identity_manager = {}
        self.global_manager = {} # uuid -> {"face": emb, "appearance": emb}
        self.frames_count = 0
        self.source_path = None
        self.session_start_time = time.time()
        
        # Statistics
        self.current_stats = {
            "total_workers": 0,
            "helmet_count": 0,
            "vest_count": 0,
            "mask_count": 0,
            "violations_today": 0 
        }

    def set_source(self, video_path):
        """Sets the video source and resets session state."""
        self.source_path = video_path
        if self.cap:
            self.cap.release()
        self.cap = cv.VideoCapture(video_path)
        
        self.reset_session()
        print(f"[INFO] Video source set to: {video_path}")

    def reset_session(self):
        """Resets the pipeline state for a new session."""
        self.identity_manager = {} 
        self.global_manager = {}
        self.frames_count = 0
        self.session_start_time = time.time()
        self.current_stats = {
            "total_workers": 0,
            "helmet_count": 0,
            "vest_count": 0,
            "mask_count": 0,
            "violations_today": 0 
        }

    def get_stats(self):
        return self.current_stats

    # -------------------- HELPERS --------------------

    def _cosine_sim(self, a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def _is_clear_face(self, face_img):
        if face_img is None or face_img.size == 0: return False
        if face_img.shape[0] < self.min_face_size or face_img.shape[1] < self.min_face_size: return False
        gray = cv.cvtColor(face_img, cv.COLOR_BGR2GRAY)
        score = cv.Laplacian(gray, cv.CV_64F).var()
        return score > self.sharpness_threshold

    def _extract_face_embedding(self, img):
        try:
            objs = DeepFace.represent(img_path=img, model_name=self.model_name, enforce_detection=True, detector_backend='opencv')
            if objs: return np.array(objs[0]["embedding"])
        except:
            pass
        return None

    def _extract_appearance_embedding(self, person_img):
        try:
            if person_img is None or person_img.size == 0: return None
            # Transform for ReID model
            img = self.transform(person_img).unsqueeze(0).to(self.device)
            with torch.no_grad():
                emb = self.reid_model(img)
            emb = emb.cpu().numpy().flatten()
            # L2 Normalize
            emb = emb / np.linalg.norm(emb)
            return emb
        except Exception as e:
            print(f"[ERROR] Appearance embedding failed: {e}")
            return None

    def _find_global_match(self, embedding, emb_type="face", threshold=0.6):
        for uuid, data in self.global_manager.items():
            if data.get(emb_type) is not None:
                sim = self._cosine_sim(embedding, data[emb_type])
                if sim > threshold:
                    return uuid
        return None

    def _compute_iou(self, boxA, boxB):
        # box: [x1, y1, x2, y2]
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interW = max(0, xB - xA)
        interH = max(0, yB - yA)
        interArea = interW * interH

        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

        unionArea = boxAArea + boxBArea - interArea
        if unionArea == 0: return 0
        return interArea / unionArea

    def _get_iou_threshold(self, ppe_name):
        if ppe_name == "vest": return 0.4
        elif ppe_name == "helmet": return 0.01
        elif ppe_name == "boots": return 0.02
        elif ppe_name == "gloves": return 0.01
        return 0.01

    # -------------------- PIPELINE --------------------

    def generate_frames(self):
        if not self.cap or not self.cap.isOpened():
             blank = np.zeros((360, 640, 3), dtype=np.uint8)
             cv.putText(blank, "Waiting for video...", (50, 180), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
             ret, buffer = cv.imencode('.jpg', blank)
             yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
             return

        while True:
            success, frame = self.cap.read()
            if not success:
                self.cap.set(cv.CAP_PROP_POS_FRAMES, 0)
                continue
            
            self.frames_count += 1
            if self.frames_count % 3 != 0: 
                continue # Skip frames
                
            # Resize
            if frame.shape[1] > 1280:
                scale = 1280 / frame.shape[1]
                frame = cv.resize(frame, (0, 0), fx=scale, fy=scale)

            processed_frame = self._process_frame(frame)
            
            ret, buffer = cv.imencode('.jpg', processed_frame, [int(cv.IMWRITE_JPEG_QUALITY), 70])
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    def _process_frame(self, frame):
        results = self.model.track(frame, persist=True, tracker="botsort.yaml", verbose=False)
        
        persons = []
        equipment = []
        
        helmet_c = 0
        vest_c = 0
        mask_c = 0

        if results[0].boxes is not None:
            for box in results[0].boxes:
                cls_id = int(box.cls[0])
                tid = int(box.id[0]) if box.id is not None else None
                coords = box.xyxy[0].cpu().numpy().astype(int)
                conf = float(box.conf[0])
                
                # Check based on user provided logic
                # Person is class 6 in user's script, originally was 5. User script says 'cls == 6' for person
                # Let's verify class names but trust user's script logic for now if model changed.
                # Actually, I should check self.class_names usually.
                # Assuming user's main.py is correct for the new model.
                
                # User script: if cls == 6 and conf >= PERSON_CONF_THRESH
                if cls_id == 6 and conf >= self.person_conf_thresh:
                    persons.append({"tid": tid, "box": coords})
                elif conf >= self.ppe_conf_thresh:
                    equipment.append({"cls": cls_id, "box": coords})
                    
                    # Update counts loosely based on detection (refined later by IoU)
                    name = self.class_names[cls_id].lower()
                    if 'helmet' in name or 'hardhat' in name: helmet_c += 1
                    if 'vest' in name: vest_c += 1
                    if 'mask' in name: mask_c += 1

        for p in persons:
            px1, py1, px2, py2 = p["box"]
            tid = p["tid"]
            
            if tid not in self.identity_manager:
                self.identity_manager[tid] = {
                    "final_uuid": None,
                    "frame_count": 0,
                    "has_logged_violation": False
                }
            
            mgr = self.identity_manager[tid]
            mgr["frame_count"] += 1
            
            person_crop = frame[max(0, py1):min(frame.shape[0], py2), max(0, px1):min(frame.shape[1], px2)]
            
            # --- 1. IDENTITY (Face -> Appearance) ---
            if mgr["final_uuid"] is None:
                # A. Face
                if self._is_clear_face(person_crop):
                    face_emb = self._extract_face_embedding(person_crop)
                    if face_emb is not None:
                        match = self._find_global_match(face_emb, "face", 0.7)
                        if match:
                            mgr["final_uuid"] = match
                        else:
                            face_fn = f"face_{tid}_{int(time.time())}.jpg"
                            face_path = os.path.join(FACES_DIR, face_fn)
                            cv.imwrite(face_path, person_crop)
                            new_id = register_new_worker(face_emb, face_fn)
                            self.global_manager[new_id] = {"face": face_emb, "appearance": None}
                            mgr["final_uuid"] = new_id
                
                # B. Appearance Fallback
                if mgr["final_uuid"] is None and mgr["frame_count"] > self.wait_for_face_limit:
                    app_emb = self._extract_appearance_embedding(person_crop)
                    if app_emb is not None:
                        match = self._find_global_match(app_emb, "appearance", 0.65)
                        if match:
                            mgr["final_uuid"] = match
                        else:
                            snap_fn = f"appearance_{tid}_{int(time.time())}.jpg"
                            snap_path = os.path.join(FACES_DIR, snap_fn)
                            cv.imwrite(snap_path, person_crop)
                            new_id = register_new_worker(app_emb, snap_fn) # Reusing register function, maybe need specific one or adapt
                            self.global_manager[new_id] = {"face": None, "appearance": app_emb}
                            mgr["final_uuid"] = new_id

            # --- 2. PPE ASSOCIATION (IoU) ---
            equipped_list = []
            for e in equipment:
                ppe_name = self.class_names[e["cls"]].lower()
                ppe_box = e["box"]
                person_box = [px1, py1, px2, py2]
                
                iou = self._compute_iou(person_box, ppe_box)
                thresh = self._get_iou_threshold(ppe_name)
                
                if iou > thresh:
                    equipped_list.append(ppe_name)

            # --- 3. VIOLATION CHECK ---
            missing_ppe = []
            # User script checks for: helmet, boots, gloves, vest explicitly
            required = ["helmet", "boots", "gloves", "vest"]
            # But we must check if these classes actually exist in standard YOLO classes or our custom model.
            # Assuming 'best (1).pt' has these classes.
            # Mapping somewhat loosely to be safe? 
            # The class names in 'best (1).pt' will dictate strings.
            # User script code uses exact strings: if "helmet" not in equipped_list...
            
            # Map known classes to requirements
            # We need to know what self.class_names returns to be 100% sure, but following user logic:
            for req in required:
                 # Check if any detected item *contains* the req string (e.g. 'Hardhat' contains 'hat'?) 
                 # User script does exact string match: `if "helmet" not in equipped_list`
                 # This implies `self.class_names` must return "helmet" etc.
                 # or we normalize `equipped_list` entries.
                 # I added .lower() above so it should be fine if model says "Helmet".
                 
                 found = False
                 for eq in equipped_list:
                     if req in eq: 
                         found = True
                         break
                 if not found:
                     missing_ppe.append(req)

            if missing_ppe and mgr["final_uuid"] is not None:
                if not mgr["has_logged_violation"]:
                    alert_fn = f"violation_{tid}_{int(time.time())}.jpg"
                    alert_path = os.path.join(ALERTS_DIR, alert_fn)
                    cv.imwrite(alert_path, person_crop)
                    
                    log_violation(
                        worker_uuid=str(mgr["final_uuid"]), 
                        equipped=", ".join(equipped_list), 
                        violated=", ".join(missing_ppe), 
                        evidence_path=alert_path
                    )
                    mgr["has_logged_violation"] = True
                    self.current_stats["violations_today"] += 1

            # --- 4. VISUALIZATION ---
            if len(missing_ppe) == 4: color = (0, 0, 255)
            elif len(missing_ppe) > 0: color = (0, 255, 255)
            else: color = (0, 255, 0)
            
            cv.rectangle(frame, (px1, py1), (px2, py2), color, 2)
            label = f"ID: {mgr['final_uuid'] or 'Scanning'}"
            cv.putText(frame, label, (px1, py1 - 10), 0, 0.6, color, 2)

        # Update Stats
        self.current_stats["helmet_count"] = helmet_c
        self.current_stats["vest_count"] = vest_c
        self.current_stats["mask_count"] = mask_c
        self.current_stats["total_workers"] = len(persons)
        
        return frame
