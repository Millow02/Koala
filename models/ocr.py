import numpy as np
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
from tensorflow.keras.preprocessing import image
from tensorflow.keras.models import load_model


# Image dimensions
img_width, img_height = 75, 100

model = load_model("ocr_cnn_model.h5")


# Function to preprocess test image
def load_and_preprocess_image(img_path):
    img = image.load_img(
        img_path, target_size=(img_width, img_height), color_mode="rgb"
    )
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array /= 255.0  # Normalize the image
    return img_array


# Path to the image you want to test
test_image_path = "image.png"

# Load and preprocess the image
test_image = load_and_preprocess_image(test_image_path)

# Predict the class of the image
predictions = model.predict(test_image)
predicted_class = np.argmax(predictions, axis=1)

# Map the predicted class index to the class label
# Manually define class labels (match the classes used in training)
class_labels = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
]
predicted_label = class_labels[predicted_class[0]]

print(f"{predicted_label}")
