import cv2
import numpy as np

def segment_characters(image_path):
    # Load the image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Image '{image_path}' not found.")
        return

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply thresholding to binarize the image
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)

    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter and extract character regions
    characters = []
    for contour in contours:
        (x, y, w, h) = cv2.boundingRect(contour)
        if h > 20:  # Filter based on height to remove noise
            char = binary[y:y+h, x:x+w]
            characters.append(char)
            cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)

    # Save segmented characters
    for i, char in enumerate(characters):
        cv2.imwrite(f'char_{i}.png', char)

    # Display the result
    cv2.imshow('Segmented Characters', image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

# Example usage
segment_characters('cars9_out_cropped_zoomed.jpg')