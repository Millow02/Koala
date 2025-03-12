from ultralytics import YOLO
import cv2
import os
import numpy as np

class LicensePlateLocalization:
    def __init__(self, model_path, threshold=0.5):
        self.model = YOLO(model_path)
        self.threshold = threshold

    def localize(self, image_path, output_image_path):
        # Read the image
        image = cv2.imread(image_path)
        if image is None:
            print("Error: Could not read image.")
            return None

        # Perform detection
        results = self.model(image)[0]

        # Draw bounding boxes on the image and crop the license plate
        for result in results.boxes.data.tolist():
            x1, y1, x2, y2, score, class_id = result

            if score > self.threshold:
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
                #_, processed_plate = cv2.threshold(cropped_plate_zoomed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

                # Add Gaussian blur
                #processed_plate = cv2.GaussianBlur(processed_plate, (3, 3), 0)

                # Apply morphological operations to remove noise
                #kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
                #processed_plate = cv2.morphologyEx(processed_plate, cv2.MORPH_CLOSE, kernel)

                # Save the cropped and zoomed license plate
                cropped_plate_path = '{}_processed.jpg'.format(os.path.splitext(output_image_path)[0])
                cv2.imwrite(cropped_plate_path, cropped_plate_zoomed)
                return cropped_plate_path
        return None