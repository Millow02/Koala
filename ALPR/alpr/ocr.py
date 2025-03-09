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

    def predict_letter(self, image_path):

        _, expected_height, expected_width, _ = self.model.input_shape
        print(f"{expected_height} and {expected_width}")

        image = load_img(image_path, target_size=(expected_height, expected_width), color_mode='rgb')
        image_array = img_to_array(image)
        image_array = np.expand_dims(image_array, axis=0)  # batch dimension
        image_array = image_array / 255.0                  # normalize to 0-1

        # 3. Predict using the model
        predictions = self.model.predict(image_array)  # shape: (1, number_of_classes)
        predicted_class_index = np.argmax(predictions[0])

        # 4. Map the predicted class index to the corresponding label
        predicted_letter = class_labels[predicted_class_index]
        
        return predicted_letter


    def ocr_from_segments(self, segment_files):
        recognized_text = ""
        for file_path in segment_files:
            letter = self.predict_letter(file_path)
            recognized_text += letter.strip()
        return recognized_text

