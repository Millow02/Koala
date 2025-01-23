import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.optimizers import Adam
import cv2
import numpy as np
import os
import xml.etree.ElementTree as ET
from sklearn.model_selection import train_test_split

# Load and preprocess the dataset
def load_data(image_dir, annotation_dir):
    images = []
    annotations = []

    for image_file in os.listdir(image_dir):
        if image_file.endswith('.jpg'):
            image_path = os.path.join(image_dir, image_file)
            annotation_path = os.path.join(annotation_dir, image_file.replace('.jpg', '.xml'))

            if os.path.exists(annotation_path):
                # Load image
                image = cv2.imread(image_path)
                image = cv2.resize(image, (224, 224))
                images.append(image)

                # Load annotation
                tree = ET.parse(annotation_path)
                root = tree.getroot()
                bboxes = []
                for obj in root.findall('object'):
                    bbox = obj.find('bndbox')
                    xmin = int(bbox.find('xmin').text)
                    ymin = int(bbox.find('ymin').text)
                    xmax = int(bbox.find('xmax').text)
                    ymax = int(bbox.find('ymax').text)
                    bboxes.append([xmin, ymin, xmax, ymax])
                annotations.append(bboxes)

    images = np.array(images)
    annotations = np.array(annotations, dtype=object)  # Use dtype=object to handle variable-length lists

    return images, annotations

# Build the model
def build_model():
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(1024, activation='relu')(x)
    predictions = Dense(4, activation='sigmoid')(x)  # 4 coordinates for bounding box
    model = Model(inputs=base_model.input, outputs=predictions)
    for layer in base_model.layers:
        layer.trainable = False
    return model

# Load data
image_dir = 'C:/Users/niraj/Desktop/pre/images'
annotation_dir = 'C:/Users/niraj/Desktop/pre/Annotations'
images, annotations = load_data(image_dir, annotation_dir)

# Preprocess data
images = images / 255.0  # Normalize images

# Flatten annotations for training
flat_annotations = []
for bboxes in annotations:
    for bbox in bboxes:
        flat_annotations.append(bbox)
flat_annotations = np.array(flat_annotations)

# Repeat images to match the number of annotations
flat_images = np.repeat(images, [len(bboxes) for bboxes in annotations], axis=0)

# Split data into training and validation sets
X_train, X_val, y_train, y_val = train_test_split(flat_images, flat_annotations, test_size=0.2, random_state=42)

# Build and train the model
model = build_model()
model.compile(optimizer=Adam(), loss='mean_squared_error')
model.fit(X_train, y_train, epochs=20, validation_data=(X_val, y_val))

# Save the model
model.save('license_plate_detector.h5')

# Function to make predictions
def predict(image_path, model):
    image = cv2.imread(image_path)
    image_resized = cv2.resize(image, (224, 224))
    image_normalized = image_resized / 255.0
    image_expanded = np.expand_dims(image_normalized, axis=0)
    prediction = model.predict(image_expanded)
    return prediction

# Example usage
image_path = 'car1.jpg'
prediction = predict(image_path, model)
print("Predicted bounding box coordinates:", prediction)