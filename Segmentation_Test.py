from ultralytics import YOLO
import cv2
import os

# Use the absolute path to the image file
image_path = 'C:/Users/niraj/Desktop/Koala/img/plate_out_processed.jpg'
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
# Load a model
model = YOLO('C:/Users/niraj/Desktop/Koala/best_segment.pt')  # load a custom model

# Perform prediction
results = model.predict(image)

# Draw bounding boxes on the image and extract each segmented box into a new image
boxes = []
for result in results:
    for box in result.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        class_id = int(box.cls[0])
        class_name = model.names[class_id]
        boxes.append((x1, class_name))
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 5)
        cv2.putText(image, class_name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        # Extract the segmented box
        #segmented_box = resized_image[y1:y2, x1:x2]
        #segmented_box_path = '{}_box_{}_{}.jpg'.format(os.path.splitext(image_path)[0], class_name, len(boxes) - 1)
        #cv2.imwrite(segmented_box_path, segmented_box)
        #print(f"Segmented box saved to: {segmented_box_path}")

# Sort boxes by x-coordinate and concatenate class names to form the license plate string
boxes.sort(key=lambda b: b[0])
license_plate = ''.join([b[1] for b in boxes])
print(f"License plate: {license_plate}")

# Save the output image with bounding boxes
cv2.imwrite(output_image_path, image)
print(f"Output image saved to: {output_image_path}")