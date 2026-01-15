import cv2 as cv
import os
from ultralytics import YOLO

# 1. Setup Model and Directories
model = YOLO("model\best.pt", task="detect")
cap = cv.VideoCapture("41501-429661287_small.mp4")
class_names = model.names 

# Create a folder to save snapshots
save_dir = "compliant_workers"
os.makedirs(save_dir, exist_ok=True)

# To prevent saving duplicate images of the same ID
saved_ids = set()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # We use frame.copy() to save a clean image without the drawn boxes
    clean_frame = frame.copy()

    results = model.track(source=frame, persist=True, tracker="botsort.yaml")
    
    if results[0].boxes is not None:
        boxes = results[0].boxes
        
        # First, find all people
        for person_box in boxes:
            cls_p = int(person_box.cls[0])
            
            if cls_p == 5: # Assuming Class 5 is Person
                p_tid = int(person_box.id[0]) if person_box.id is not None else 0
                px1, py1, px2, py2 = person_box.xyxy[0].cpu().numpy().astype(int)

                # Inner Loop: Check if this person is wearing a vest (Class 2)
                for vest_box in boxes:
                    cls_v = int(vest_box.cls[0])
                    
                    if cls_v == 2: # Assuming Class 2 is Vest
                        vx1, vy1, vx2, vy2 = vest_box.xyxy[0].cpu().numpy().astype(int)
                        v_center_x = (vx1 + vx2) // 2
                        v_center_y = (vy1 + vy2) // 2

                        # Check if vest center is inside person's box
                        if px1 < v_center_x < px2 and py1 < v_center_y < py2:
                            
                            # Save snapshot only if not saved before
                            if p_tid not in saved_ids and p_tid != 0:
                                snapshot = clean_frame[py1:py2, px1:px2] # Crop to person
                                
                                if snapshot.size > 0: # Ensure crop is valid
                                    file_path = f"{save_dir}/person_{p_tid}_vest.jpg"
                                    cv.imwrite(file_path, snapshot)
                                    print(f"--- Saved Snapshot for ID: {p_tid} ---")
                                    saved_ids.add(p_tid)

                # Visualization for the live feed
                cv.rectangle(frame, (px1, py1), (px2, py2), (0, 255, 0), 2)
                cv.putText(frame, f"Person ID:{p_tid}", (px1, py1 - 10), 
                           cv.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    cv.imshow("Safety Compliance Monitor", frame)
    if cv.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv.destroyAllWindows()