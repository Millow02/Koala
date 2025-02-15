import cv2
import os
from picamera2 import Picamera2
from ultralytics import YOLO

# Initialize the Picamera2
picam2 = Picamera2()
picam2.preview_configuration.main.size = (640, 480)
picam2.preview_configuration.main.format = "RGB888"
picam2.preview_configuration.align()
picam2.configure("preview")
picam2.start()

# Load the YOLO11 model, change path if necessary
model = YOLO("localisation_pi_model.ncnn")

# Create a directory to save license plates
output_dir = "license_plates_unprocessed"
os.makedirs(output_dir, exist_ok=True)

plate_count = 0

while True:
    # Capture frame-by-frame
    frame = picam2.capture_array()

    # Run YOLO11 inference on the frame
    results = model(frame)

    # Visualize the results on the frame
    annotated_frame = results[0].plot()

    # Extract license plate regions
    for result in results:
        for bbox in result.boxes:
            x1, y1, x2, y2 = map(int, bbox.xyxy)
            license_plate = frame[y1:y2, x1:x2]
            cv2.imshow("License Plate", license_plate)

            # Save the license plate image
            plate_filename = os.path.join(output_dir, f"plate_{plate_count}.jpg")
            cv2.imwrite(plate_filename, license_plate)
            plate_count += 1

    # Display the resulting frame
    cv2.imshow("Camera", annotated_frame)

    # Break the loop if 'q' is pressed
    if cv2.waitKey(1) == ord("q"):
        break

# Release resources and close windows
cv2.destroyAllWindows()