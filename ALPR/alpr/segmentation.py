import os
import cv2
import numpy as np
from ultralytics import YOLO

class Segmentation:
    def __init__(self, model_path, zoom=20):
        self.model = YOLO(model_path)
        self.zoom = zoom

    def segment_characters(self, image_path, output_dir):
        os.makedirs(output_dir, exist_ok=True)
        image = cv2.imread(image_path)
        results = self.model.predict(source=image_path)
        segments = []
        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            labels = result.boxes.cls.cpu().numpy()  # in case you need them
            for idx, box in enumerate(boxes):
                x1, y1, x2, y2 = map(int, box)
                crop = image[max(y1-self.zoom, 0):min(y2+self.zoom, image.shape[0]),
                             max(x1-self.zoom, 0):min(x2+self.zoom, image.shape[1])]
                segments.append(crop)
                seg_filename = os.path.join(output_dir, f"segment_{idx+1}.jpg")
                cv2.imwrite(seg_filename, crop)
        return segments
