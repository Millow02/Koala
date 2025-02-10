import os
import cv2 

# find contours

def find_contours(image_path):
    """
        Finds the contours(edges) of cropped license plate
    """
    directory = "/nfs/speed-scratch/z_amm/COEN490/Koala/ALPR/YOLOv8n_TEST"
    os.chdir(directory)

    im = cv2.imread(image_path)
    assert im is not None, "file could not be read, check with os.path.exists()"
    imgray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(imgray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    blur = cv2.GaussianBlur(thresh,(5,5),0)
    th3 = cv2.threshold(blur,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)[1]
    contours, hierarchy = cv2.findContours(th3, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Filtering contours
    license_plate_contour = None
    for cnt in contours:
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Define aspect ratio and size constraints
        aspect_ratio = w / float(h)
        if 2 < aspect_ratio < 6 and 1000 < cv2.contourArea(cnt) < 30000:  
            approx = cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True)
            
            # Check if it's a quadrilateral (4 corners)
            if len(approx) == 4:
                license_plate_contour = approx
                break  # Assuming only one plate, stop searching
    
    # Draw the detected license plate
    if license_plate_contour is not None:
        cv2.drawContours(im, [license_plate_contour], -1, (0, 255, 0), 3)
    
    print("Before saving image:")  
    print(os.listdir(directory))  

    cv2.imwrite("img_contour_out.jpg", im)

image_path = '/speed-scratch/z_amm/COEN490/Koala/ALPR/YOLOv8n_TEST/cropped_outputs/cropped_object_1.jpg'
find_contours(image_path)