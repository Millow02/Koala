from Localisation_Test import LicensePlateLocalization
from Segmentation_Test import LicensePlateSegmentation
import os

# Paths to the models
localization_model_path = './localization_model.pt'
segmentation_model_path = './best_segment_model.pt'

image_folder = './img'
if not os.path.exists(image_folder):
    os.makedirs(image_folder)
image_path = os.path.join(image_folder, 'captured_plate.jpg')

output_image_path = '{}_segmented.jpg'.format(os.path.splitext(image_path)[0])

# Create instances of the classes
localizer = LicensePlateLocalization(localization_model_path)
segmenter = LicensePlateSegmentation(segmentation_model_path)

# Perform localization
cropped_plate_path = localizer.localize(image_path, output_image_path)

# Perform segmentation if localization was successful
if cropped_plate_path:
    segmenter.segment(cropped_plate_path, output_image_path)
