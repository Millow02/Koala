import os
import cv2
import numpy as np
from ultralytics import YOLO
from alpr.utils import log,add_bp 

class Localisation:
    def __init__(self, model_path):
        self.model = YOLO(model_path)

    def replace_model(self, model_path):
        self.model = YOLO(model_path)

    def crop_license_plate(self, image_path, output_dir, padding_levels=[20], confidence=0.25, iou=0.45):
        """
        The licence plate detection can be filtered using two variables:
            confidence & iou
            
        Decreasing iou gives more detection. 
        Decreasing confidence gives more detections.

        A list of all padding levels needs to be passed and list of all the cropped directories is returned.
        """

        image = cv2.imread(image_path)
        if image is None:
            log("LOCALISATION", f"{image_path} does not contain an image.")
            raise ValueError("Image path invalid or image format not supported.")

        results = self.model.predict(source=image_path, conf=confidence, iou=iou)
    
        log("LOCALISATION", f"Cropped Image successfully, number of license plates detected - {len(results)}.")
        cropped_directories = []
        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            for idx, box in enumerate(boxes):
                for padding in padding_levels:

                    specific_crop_dir = os.path.join(output_dir, f"crop_{padding}")
                    os.makedirs(specific_crop_dir , exist_ok=True)
                    
                    x1, y1, x2, y2 = map(int, box)
                    x1, y1 = max(x1 - padding, 0), max(y1 - padding, 0)
                    x2, y2 = x2 + padding, y2 + padding

                    crop = image[y1:y2, x1:x2]

                    crop_filename = os.path.join(specific_crop_dir, f"crop.jpg")
                    cv2.imwrite(crop_filename, crop)
                    cropped_directories.append(specific_crop_dir)
                    log("LOCALISATION", f"Saved image {crop_filename} in directory {specific_crop_dir}.")

        return output_dir
