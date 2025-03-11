from ultralytics import YOLO
import cv2
import os
import numpy as np
from PIL import Image

# Use the absolute path to the image files
image_path = 'C:/Users/niraj/OneDrive/Desktop/Koala/img/plate5.jpg'
output_image_path = '{}.jpg'.format(os.path.splitext(image_path)[0])

# Debugging information
print(f"Image path: {image_path}")
print(f"Absolute image path: {os.path.abspath(image_path)}")

# Check if the image file exists
if not os.path.exists(image_path):
    print("Error: Image file does not exist.")
    exit()

# Read the image
image = cv2.imread(image_path)
if image is None:
    print("Error: Could not read image.")
    exit()

# Load a model
model = YOLO('C:/Users/niraj/OneDrive/Desktop/Koala/localization_model.pt')  # load a custom model

threshold = 0.5

# Perform detection
results = model(image)[0]

# Draw bounding boxes on the image and crop the license plate
for result in results.boxes.data.tolist():
    x1, y1, x2, y2, score, class_id = result

    if score > threshold:
        # Draw bounding box
        cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
        cv2.putText(image, results.names[int(class_id)].upper(), (int(x1), int(y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3, cv2.LINE_AA)
        
        # Crop the license plate
        cropped_plate = image[int(y1):int(y2), int(x1):int(x2)]

        # Resize and grayscale the cropped license plate
        cropped_plate_zoomed = cv2.cvtColor(cropped_plate, cv2.COLOR_BGR2GRAY)
        cropped_plate_zoomed = cv2.resize(cropped_plate_zoomed, (640, 480))

        # Add binarization to zoomed plate
        _, processed_plate = cv2.threshold(cropped_plate_zoomed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Add Gaussian blur
        processed_plate = cv2.GaussianBlur(processed_plate, (3, 3), 0)

        # Apply morphological operations to remove noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        processed_plate = cv2.morphologyEx(processed_plate, cv2.MORPH_CLOSE, kernel)

        # Detect skew angle
        edges = cv2.Canny(processed_plate, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)
        if lines is not None:
            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
                angles.append(angle)
            median_angle = np.median(angles)
            if abs(median_angle) > 1:  # Rotate only if the angle is significant
                height, width = processed_plate.shape[:2]
                rotation_matrix = cv2.getRotationMatrix2D((width / 2, height / 2), 15, 1)
                processed_plate = cv2.warpAffine(processed_plate, rotation_matrix, (width, height))

        # Save the cropped and zoomed license plate
        cropped_plate_path = '{}_processed.jpg'.format(os.path.splitext(output_image_path)[0])
        cv2.imwrite(cropped_plate_path, processed_plate)
        print(f"Cropped and zoomed license plate saved to: {cropped_plate_path}")