import cv2
import base64
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from ultralytics import YOLO
import numpy as np

# --- Configuration ---
# IMPORTANT: Update these paths to your local files
MODEL_PATH = "backend/toddler-knife-yolo.onnx" # Or .onnx
VIDEO_PATH = "backend/sample.mp4"

DANGER_ZONE = {"xmin": 23, "ymin": 84, "xmax": 533, "ymax": 328}
CLASS_MAP = {0: "toddler", 1: "non-toddler", 2: "knife"}
TARGET_FPS = 30

# Load the YOLO model ONCE when the application starts
try:
    MODEL = YOLO(MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")
    exit()

app = FastAPI()

def is_box_in_danger_zone(box_xyxy):
    """Checks if a bounding box overlaps with the danger zone."""
    box_x1, box_y1, box_x2, box_y2 = box_xyxy
    zone = DANGER_ZONE
    
    # Simple overlap check: True if the bounding boxes are not separate
    if (box_x2 < zone["xmin"] or box_x1 > zone["xmax"] or box_y2 < zone["ymin"] or box_y1 > zone["ymax"]):
        return False
    return True

@app.websocket("/ws/video_feed")
async def video_feed(websocket: WebSocket):
    await websocket.accept()
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print("Error: Could not open video.")
        await websocket.close(code=1011, reason="Video file not found")
        return

    try:
        while True:
            success, frame = cap.read()
            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0) # Loop video
                continue

            results = MODEL(frame, verbose=False)
            
            alert_payload = {"toddler_in_zone": False, "knife_detected": False}

            if results and results[0].boxes:
                boxes = results[0].boxes
                for i in range(len(boxes.cls)):
                    class_id = int(boxes.cls[i])
                    label = CLASS_MAP.get(class_id, "Unknown")
                    confidence = float(boxes.conf[i])
                    coords = boxes.xyxy[i]
                    x1, y1, x2, y2 = map(int, coords)

                    color = (0, 255, 0)
                    if label == "toddler":
                        color = (0, 0, 255)
                        if is_box_in_danger_zone(coords):
                            alert_payload["toddler_in_zone"] = True
                    elif label == "knife":
                        color = (0, 165, 255)
                        alert_payload["knife_detected"] = True

                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f"{label}: {confidence:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            zone = DANGER_ZONE
            cv2.rectangle(frame, (zone["xmin"], zone["ymin"]), (zone["xmax"], zone["ymax"]), (255, 255, 0), 2)

            if alert_payload["toddler_in_zone"]:
                cv2.putText(frame, 'ALERT: Child Near Unsafe Area!', (40, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

            _, buffer = cv2.imencode('.jpg', frame)
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')

            await websocket.send_json({"image": jpg_as_text, "alerts": alert_payload})
            await asyncio.sleep(1 / TARGET_FPS)

    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        cap.release()