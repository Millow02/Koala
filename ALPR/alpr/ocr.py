import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from openalpr import Alpr
import tensorflow as tf

class OCR:
    def __init__(self, model_path):
        self.model = tf.keras.models.load_model(model_path)
        self.class_labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                             'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
                             'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U',
                             'V', 'W', 'X', 'Y', 'Z']

    def predict_letter(self, plate_image,
                                 country="us",
                                 config="/etc/openalpr/openalpr.conf",
                                 runtime_data="/usr/share/openalpr/runtime_data"):
        """
        Process a license plate image using OpenALPR and return the license plate number.
        
        Args:
            plate_image (str): Path to the license plate image file.
            country (str): Country code for the license plate. Default is "us".
            config (str): Path to the openalpr configuration file.
            runtime_data (str): Path to the OpenALPR runtime_data directory.
        
        Returns:
            str or None: The license plate number with the highest confidence for the first detected plate,
                         or None if no plate was detected.
        """
        alpr = None
        plate_number = None
        try:
            alpr = Alpr(country, config, runtime_data)
            if not alpr.is_loaded():
                print("Error loading OpenALPR")
                return None
            else:
                print("Using OpenALPR " + alpr.get_version())
            
            # Configure OpenALPR settings
            alpr.set_top_n(7)
            alpr.set_default_region("wa")
            alpr.set_detect_region(False)
            
            # Read image bytes from the file
            with open(plate_image, "rb") as f:
                jpeg_bytes = f.read()
            
            # Recognize the plate from the image bytes
            results = alpr.recognize_array(jpeg_bytes)
            
            for plate in results['results']:
                for candidate in plate['candidates']:
                    plate_number = candidate['plate']
                    break;
            else:
                print("No license plate detected.")
        
        except Exception as e:
            print("Error during OpenALPR processing:", e)
        finally:
            if alpr:
                alpr.unload()
        
        # print(f"Plate Number Detected in direct segmentation output: {plate_number}")
        return plate_number

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

