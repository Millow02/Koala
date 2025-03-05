from ultralytics import YOLO
import cv2
import os

# Use the absolute path to the image file
image_path = 'C:/Users/niraj/Desktop/Koala/img/0b1b0525-car_363_out_processed.jpg'
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

# Increase the image size
scale_percent = 1500  # percent of original size
width = int(image.shape[1] * scale_percent / 100)
height = int(image.shape[0] * scale_percent / 100)
dim = (width, height)
resized_image = cv2.resize(image, dim, interpolation=cv2.INTER_LINEAR)

# Load a model
model = YOLO('C:/Users/niraj/Desktop/Koala/best_segment.pt')  # load a custom model

# Perform prediction
results = model.predict(resized_image)

# Draw bounding boxes on the image and extract each segmented box into a new image
box_count = 0
for result in results:
    for box in result.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        cv2.rectangle(resized_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Extract the segmented box
        segmented_box = resized_image[y1:y2, x1:x2]
        segmented_box_path = '{}_box_{}.jpg'.format(os.path.splitext(image_path)[0], box_count)
        cv2.imwrite(segmented_box_path, segmented_box)
        print(f"Segmented box saved to: {segmented_box_path}")
        box_count += 1

# Save the output image with bounding boxes
cv2.imwrite(output_image_path, resized_image)
print(f"Output image saved to: {output_image_path}")