from ultralytics import YOLO
import cv2
import os

class LicensePlateSegmentation:
    def __init__(self, model_path):
        self.model = YOLO(model_path)

    def segment(self, image_path, output_image_path):
        # Read the image
        image = cv2.imread(image_path)
        if image is None:
            print("Error: Could not read image.")
            return

        # Perform prediction
        results = self.model.predict(image)

        # Draw bounding boxes on the image and extract each segmented box into a new image
        boxes = []
        char_count = 0
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]
                boxes.append((x1, class_name))
                cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(image, class_name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        # Sort boxes by x-coordinate and concatenate class names to form the license plate string
        boxes.sort(key=lambda b: b[0])
        license_plate = ''.join([b[1] for b in boxes])
        print(f"License plate: {license_plate}")

        # Save the output image with bounding boxes
        cv2.imwrite(output_image_path, image)
        