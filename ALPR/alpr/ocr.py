import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import tensorflow as tf

class OCR:
    def __init__(self, model_path):
        self.model = tf.keras.models.load_model(model_path)
        self.class_labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                             'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
                             'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U',
                             'V', 'W', 'X', 'Y', 'Z']

    def predict_letter(self, image_path, target_size):
        image = load_img(image_path, target_size=target_size, color_mode='rgb')
        image_array = img_to_array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        predictions = self.model.predict(image_array)
        predicted_index = np.argmax(predictions[0])
        return self.class_labels[predicted_index]

    def ocr_from_segments(self, segment_files, target_size):
        recognized_text = ""
        for file_path in segment_files:
            letter = self.predict_letter(file_path, target_size)
            recognized_text += letter.strip()
        return recognized_text
