from ultralytics import YOLO
import cv2
import os

# Use the absolute path to the video file
video_path = 'C:/Users/niraj/OneDrive/Desktop/localizationtest/videos/car32.mp4'
video_path_out = '{}_out.mp4'.format(video_path)

# Debugging information
print(f"Video path: {video_path}")
print(f"Absolute video path: {os.path.abspath(video_path)}")

# Check if the video file exists
if not os.path.exists(video_path):
    print("Error: Video file does not exist.")
    exit()

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("Error: Could not open video.")
    exit()

ret, frame = cap.read()
if not ret:
    print("Error: Could not read frame from video.")
    exit()

H, W, _ = frame.shape
out = cv2.VideoWriter(video_path_out, cv2.VideoWriter_fourcc(*'MP4V'), int(cap.get(cv2.CAP_PROP_FPS)), (W, H))

# Load a model
model = YOLO('C:/Users/niraj/OneDrive/Desktop/localizationtest/runs/detect/train12/weights/best.pt')  # load a custom model

threshold = 0.5

while ret:
    results = model(frame)[0]

    for result in results.boxes.data.tolist():
        x1, y1, x2, y2, score, class_id = result

        if score > threshold:
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 4)
            cv2.putText(frame, results.names[int(class_id)].upper(), (int(x1), int(y1 - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3, cv2.LINE_AA)

    out.write(frame)
    ret, frame = cap.read()

cap.release()
out.release()
cv2.destroyAllWindows()