from Localisation_Test import LicensePlateLocalization
from Segmentation_Test import LicensePlateSegmentation
import os 

# Paths to the models
localization_model_path = 'C:/Users/niraj/Desktop/Koala/localization_model.pt'
segmentation_model_path = 'C:/Users/niraj/Desktop/Koala/improved_segmentation_model.pt'

# Paths to the images
image_path = 'C:/Users/niraj/Desktop/Koala/img/plate10.jpg'
output_image_path = '{}_segmented.jpg'.format(os.path.splitext(image_path)[0])

# Create instances of the classes
localizer = LicensePlateLocalization(localization_model_path)
segmenter = LicensePlateSegmentation(segmentation_model_path)

# Perform localization
cropped_plate_path = localizer.localize(image_path, output_image_path)

# Perform segmentation if localization was successful
if cropped_plate_path:
    segmenter.segment(cropped_plate_path, output_image_path)