#rotate image 

import cv2
import os
import numpy as np

# Use the absolute path to the image file
image_path = 'C:/Users/niraj/Desktop/Koala/img/f80d28cd-car_453_out_processed.jpg'
output_image_path = '{}_out.jpg'.format(os.path.splitext(image_path)[0])

# Debugging information
print(f"Image path: {image_path}")
print(f"Absolute image path: {os.path.abspath(image_path)}")

# Check if the image file exists
if not os.path.exists(image_path):
    print("Error: Image file does not exist.")
    exit()

# Read the image
image = cv2.imread(image_path)
if image is None:
    print("Error: Could not read image.")
    exit()

# Rotate the image
angle = 15  # Specify the angle of rotation
center = (image.shape[1] // 2, image.shape[0] // 2)
rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
rotated_image = cv2.warpAffine(image, rotation_matrix, (image.shape[1], image.shape[0]))
rotated_image_path = '{}_rotated.jpg'.format(os.path.splitext(output_image_path)[0])
cv2.imwrite(rotated_image_path, rotated_image)
print(f"Rotated image saved to: {rotated_image_path}")
cv2.imshow('Rotated Image', rotated_image)
cv2.waitKey(0)
cv2.destroyAllWindows()
# Save the rotated imag