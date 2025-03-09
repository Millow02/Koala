# alpr/localisation.py
import os
import cv2
import numpy as np
from ultralytics import YOLO

class Localisation:
    def __init__(self, model_path):
        self.model = YOLO(model_path)

    def crop_license_plate(self, image_path, output_dir, padding=20):
        os.makedirs(output_dir, exist_ok=True)
        image = cv2.imread(image_path)
        results = self.model.predict(source=image_path, conf=0.25, iou=0.45)
        crops = []
        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            for idx, box in enumerate(boxes):
                x1, y1, x2, y2 = map(int, box)
                # Apply padding and ensure bounds are valid
                x1, y1 = max(x1-padding, 0), max(y1-padding, 0)
                x2, y2 = x2+padding, y2+padding
                crop = image[y1:y2, x1:x2]
                crops.append(crop)
                crop_filename = os.path.join(output_dir, f"crop_{idx+1}.jpg")
                cv2.imwrite(crop_filename, crop)
        return crops
