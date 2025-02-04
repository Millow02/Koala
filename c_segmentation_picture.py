from ultralytics import YOLO
import cv2
import os

# Use the absolute path to the image file
image_path = 'C:/Users/niraj/OneDrive/Desktop/Koala/car5.jpg'
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
model = YOLO('C:/Users/niraj/OneDrive/Desktop/Koala/runs/detect/train13/weights/best.pt')  # load a custom model

threshold = 0.5

# Perform detection
results = model(image)[0]

# Draw bounding boxes on the image and crop the license plate
for result in results.boxes.data.tolist():
    x1, y1, x2, y2, score, class_id = result

    if score > threshold:
        # Draw bounding box
        cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 4)
        cv2.putText(image, results.names[int(class_id)].upper(), (int(x1), int(y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3, cv2.LINE_AA)

        # Crop the license plate
        cropped_plate = image[int(y1):int(y2), int(x1):int(x2)]

        # Resize (zoom) the cropped license plate
        zoom_factor = 2  # Adjust the zoom factor as needed
        cropped_plate_zoomed = cv2.resize(cropped_plate, None, fx=zoom_factor, fy=zoom_factor, interpolation=cv2.INTER_LINEAR)

        # Save the cropped and zoomed license plate
        cropped_plate_path = '{}_cropped_zoomed.jpg'.format(os.path.splitext(output_image_path)[0])
        cv2.imwrite(cropped_plate_path, cropped_plate_zoomed)
        print(f"Cropped and zoomed license plate saved to: {cropped_plate_path}")

# Save the output image with bounding boxes
cv2.imwrite(output_image_path, image)
print(f"Output image saved to: {output_image_path}")

cv2.destroyAllWindows()