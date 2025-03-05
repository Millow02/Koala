from ultralytics import YOLO
import cv2
import os

# Use the absolute path to the image files
image_path = 'C:/Users/niraj/Desktop/Koala/img/quebec-car-license-plate-with-snow-in-winter-season-FAT51P.jpg'
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

model = YOLO('C:/Users/niraj/Desktop/Koala/best.pt')  # load a custom model

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

        #Resize (zoom) and grayscale the cropped licensee
        cropped_plate_zoomed = cv2.resize(cropped_plate,(640,480))
        cropped_plate_zoomed = cv2.cvtColor(cropped_plate_zoomed, cv2.COLOR_BGR2GRAY)

        #Add binarization to zoomed plate
        _, processed_plate = cv2.threshold(cropped_plate_zoomed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
        #Add gaussian blur
        processed_plate = cv2.GaussianBlur(processed_plate, (3, 3), 0)

        # Save the cropped and zoomed license plate
        cropped_plate_path = '{}_processed.jpg'.format(os.path.splitext(output_image_path)[0])
        cv2.imwrite(cropped_plate_path,processed_plate)
        print(f"Cropped and zoomed license plate saved to: {cropped_plate_path}")

# Save the output image with bounding boxes
cv2.imwrite(output_image_path, image)
print(f"Output image saved to: {output_image_path}")

cv2.destroyAllWindows()