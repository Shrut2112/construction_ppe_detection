import cv2 as cv
from deepface import DeepFace
import numpy as np
from collections import Counter
from ultralytics import YOLO
import time
import os
# Ensure these match your database.py function names exactly
from database.database import get_connection, log_violation, register_new_worker, find_matching_worker, update_worker_id_in_violations

# 1. SETUP DIRECTORIES
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FACES_DIR = os.path.join(BASE_DIR, "storage", "faces")
ALERTS_DIR = os.path.join(BASE_DIR, "storage", "alerts")
os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs(ALERTS_DIR, exist_ok=True)

# 2. MODEL INITIALIZATION
model = YOLO(r"model\best.pt")
CLASS_NAMES = model.names
print(f"[INFO] Loaded classes: {CLASS_NAMES}")

# 3. CONFIGURATION
MIN_FACE_SIZE = 40
SHARPNESS_THRESHOLD = 80 # Slightly lowered to catch more faces
VOTE_LIMIT = 5           # Lowered for faster identification
WAIT_FOR_FACE_LIMIT = 25 # Wait 25 frames for face before falling back to appearance
MODEL_NAME = "Facenet" 

def extract_appearance_embedding(person_img):
    """Extracts a color histogram as a simple appearance embedding."""
    try:
        if person_img.size == 0: return None
        # Resize to standard size to normalize
        resized = cv.resize(person_img, (64, 128)) 
        hsv = cv.cvtColor(resized, cv.COLOR_BGR2HSV)
        
        # Calculate histogram (Hue, Saturation)
        # Using 8 bins for Hue, 8 for Saturation, 8 for Value = 512 dimensions (flattened)
        # Or simpler: 
        hist = cv.calcHist([hsv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
        cv.normalize(hist, hist)
        return hist.flatten() # Returns 1D array (512 elements)
    except Exception as e:
        print(f"[ERROR] Appearance extraction failed: {e}")
        return None
 

cap = cv.VideoCapture(r"videos\8853531-sd_640_360_24fps.mp4")

identity_manager = {}

def is_clear_face(face_img):
    if face_img.shape[0] < MIN_FACE_SIZE or face_img.shape[1] < MIN_FACE_SIZE:
        return False
    gray = cv.cvtColor(face_img, cv.COLOR_BGR2GRAY)
    score = cv.Laplacian(gray, cv.CV_64F).var()
    return score > SHARPNESS_THRESHOLD

print("[INFO] Starting video processing...")

frames = 0

while cap.isOpened():
    ret, frame = cap.read()
    frames += 1
    if not ret: break

    if frames % 2 == 0:
        continue

    # YOLO Tracking
    results = model.track(frame, persist=True, tracker="botsort.yaml")
    
    if results[0].boxes is not None:
        persons = []
        equipment = []
        
        # Separate Detections
        for box in results[0].boxes:
            cls = int(box.cls[0])
            tid = int(box.id[0]) if box.id is not None else None
            coords = box.xyxy[0].cpu().numpy().astype(int)
            
            if cls == 5: # Person
                persons.append({"tid": tid, "box": coords})
            elif cls in [0, 1, 6, 7]: # PPE Classes
                equipment.append({"cls": cls, "box": coords})

        for p in persons:
            px1, py1, px2, py2 = p["box"]
            tid = p["tid"]
            
            if tid not in identity_manager:
                identity_manager[tid] = {
                    "votes": [], 
                    "final_uuid": None, 
                    "frame_count": 0, 
                    "has_logged_violation": False,
                    "is_registering": False
                }
            
            mgr = identity_manager[tid]

            mgr["frame_count"] += 1
            
            # Ensure crop is within frame boundaries
            person_crop = frame[max(0, py1):min(frame.shape[0], py2), 
                                max(0, px1):min(frame.shape[1], px2)]

            # --- STEP 2: IDENTIFICATION & UPDATE ---
            # --- STEP 2: UNIFIED REGISTRATION STRATEGY ---
            # Goal: Get 1 Embedding per person (Face preferred, Appearance fallback)
            
            if mgr["final_uuid"] is None:
                
                # A. Try to find a FACE
                if is_clear_face(person_crop):
                    try:
                        objs = DeepFace.represent(img_path=person_crop, model_name=MODEL_NAME, 
                                                enforce_detection=True, detector_backend='opencv')
                        if objs:
                            face_data = objs[0]
                            embedding = np.array(face_data["embedding"])
                            
                            # Check if matches existing worker
                            matched_uuid = find_matching_worker(embedding, threshold=0.45)
                            
                            if matched_uuid:
                                mgr["votes"].append(matched_uuid)
                                if len(mgr["votes"]) >= VOTE_LIMIT:
                                    real_uuid = Counter(mgr["votes"]).most_common(1)[0][0]
                                    mgr["final_uuid"] = real_uuid
                                    print(f"[SUCCESS] ID Identified: {real_uuid}")
                            else:
                                # New Face -> Register Immediately
                                face_filename = f"face_{tid}_{int(time.time())}.jpg"
                                face_path = os.path.join(FACES_DIR, face_filename)
                                cv.imwrite(face_path, person_crop)
                                
                                new_id = register_new_worker(embedding, face_path)
                                mgr["final_uuid"] = new_id
                                print(f"[DB] New Worker Registered (Face): {new_id}")
                    except Exception as e:
                        # print(f"Face Error: {e}")
                        pass

                # B. Timeout: If no face found after limit, use APPEARANCE
                if mgr["final_uuid"] is None and mgr["frame_count"] > WAIT_FOR_FACE_LIMIT:
                    print(f"[TIMEOUT] No face for Track {tid} after {WAIT_FOR_FACE_LIMIT} frames. Using Appearance.")
                    
                    app_emb = extract_appearance_embedding(person_crop)
                    
                    if app_emb is not None:
                        snap_fn = f"appearance_{tid}_{int(time.time())}.jpg"
                        snap_path = os.path.join(FACES_DIR, snap_fn)
                        cv.imwrite(snap_path, person_crop)
                        
                        # Register with Appearance Embedding
                        new_id = register_new_worker(app_emb, snap_path)
                        mgr["final_uuid"] = new_id
                        print(f"[DB] New Worker Registered (Appearance): {new_id}")
                    else:
                        print(f"[ERROR] Could not extract appearance for {tid}")


            # --- STEP 3: EQUIPMENT ASSOCIATION ---
            equipped_list = []
            for e in equipment:
                ex1, ey1, ex2, ey2 = e["box"]
                cx, cy = (ex1 + ex2) // 2, (ey1 + ey2) // 2
                if px1 < cx < px2 and py1 < cy < py2:
                    equipped_list.append(CLASS_NAMES[e['cls']])

            # --- STEP 4: LOGGING ---
            required_ppe = ['Hardhat', 'Mask', 'Safety Vest']
            missing_ppe = [item for item in required_ppe if item not in equipped_list]

            if missing_ppe and mgr["final_uuid"] is not None:
                if not mgr["has_logged_violation"]:
                    alert_fn = f"violation_{tid}_{int(time.time())}.jpg"
                    alert_path = os.path.join(ALERTS_DIR, alert_fn)
                    
                    try:
                        log_violation(
                            worker_uuid=str(mgr["final_uuid"]), 
                            equipped=", ".join(equipped_list), 
                            violated=", ".join(missing_ppe),
                            evidence_path=alert_path
                        )
                        # Save PERSON CROP as evidence, not full frame
                        cv.imwrite(alert_path, person_crop)
                        mgr["has_logged_violation"] = True 
                        print(f"[DB] Logged violation for {mgr['final_uuid']}")
                    except Exception as e:
                        print(f"[DB ERROR] {e}")

            # --- STEP 5: VISUALIZATION ---
            # Red: All 3 missing | Yellow: Some missing | Green: None missing
            if len(missing_ppe) == 3:
                color = (0, 0, 255)    # Red
            elif len(missing_ppe) > 0:
                color = (0, 255, 255)  # Yellow
            else:
                color = (0, 255, 0)    # Green
            
            cv.rectangle(frame, (px1, py1), (px2, py2), color, 2)
            label = f"ID: {mgr['final_uuid'] or 'Scanning'}"
            cv.putText(frame, label, (px1, py1 - 10), 0, 0.6, color, 2)

    cv.imshow("PPE System Final", frame)
    if cv.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv.destroyAllWindows()