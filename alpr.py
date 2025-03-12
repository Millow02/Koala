from Localisation_Test import LicensePlateLocalization
from Segmentation_Test import LicensePlateSegmentation
import os
from picamera import PiCamera
from time import sleep

# Paths to the models
localization_model_path = 'C:/Users/niraj/OneDrive/Desktop/Koala/localization_model_ncnn_model'
segmentation_model_path = 'C:/Users/niraj/OneDrive/Desktop/Koala/best_segment_model_ncnn_model'

# Initialize PiCamera
camera = PiCamera()

# Capture image from PiCamera
image_folder = 'C:/Users/niraj/OneDrive/Desktop/Koala/pi_image'
if not os.path.exists(image_folder):
    os.makedirs(image_folder)
image_path = os.path.join(image_folder, 'captured_plate.jpg')

camera.start_preview()
sleep(5)  # Allow the camera to warm up and capture image after 5 seconds
camera.capture(image_path)
camera.stop_preview()

output_image_path = '{}_segmented.jpg'.format(os.path.splitext(image_path)[0])

# Create instances of the classes
localizer = LicensePlateLocalization(localization_model_path)
segmenter = LicensePlateSegmentation(segmentation_model_path)

# Perform localization
cropped_plate_path = localizer.localize(image_path, output_image_path)

# Perform segmentation if localization was successful
if cropped_plate_path:
    segmenter.segment(cropped_plate_path, output_image_path)