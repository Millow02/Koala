import os
import cv2
import numpy as np
from ultralytics import YOLO
from alpr.utils import starter_log, log, add_bp, test_manager

class Upscaler:
    def __init__(self, 
                 sr_model_path):
        self.sr = cv2.dnn_superres.DnnSuperResImpl_create()
        self.sr.readModel(sr_model_path)
        self.sr.setModel("lapsrn", 2)

    def get_sr(self):
        return self.sr

    def upscale_image(self, image, image_dims):
        """
        Upsample and resize the input image to standard dimensions for further processing.
        
        Returns:
            np.array: Preprocessed image.
        """
        # Upsample the image using the super-resolution model.
        upsampled_image = self.sr.upsample(image)
        log("UPSCALER", "Preprocessing completed.")
        return cv2.resize(upsampled_image, image_dims)
