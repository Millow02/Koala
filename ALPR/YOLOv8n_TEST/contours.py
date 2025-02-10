import os
import cv2 

# find contours

# find contours

def upscale_img(im):
    scale_factor = 5.0
    new_width = int(im.shape[1] * scale_factor)
    new_height = int(im.shape[0] * scale_factor)

    # Resize the image using cubic interpolation (better quality)
    upscaled_im = cv2.resize(im, (new_width, new_height), interpolation=cv2.INTER_CUBIC)

    return upscaled_im

def find_rect(cnt_points):
    """
    Returns a list of rectangles set as 4 points 
    """
    # first find the leftmost point out of all the contours
    
    print(cnt_points)
    biggest_rect = []
    for cnt in cnt_points: 
        leftmost = min(cnt, key=lambda p: p[0][0]*p[0][0] + p[0][1]*p[0][1])
        sorted_points = sorted(cnt, key=lambda p: (leftmost[0][0] - p[0][0]) * (leftmost[0][0] - p[0][0]) + (leftmost[0][1] - p[0][1]) * (leftmost[0][1] - p[0][1]), reverse=True)
        biggest_rect.append(np.array([leftmost, *sorted_points[:3]]))
    print("Printing biggest_rect")
    print(biggest_rect)
    return biggest_rect

def find_contours(image_path):
    """
        Finds the contours(edges) of cropped license plate
    """
    directory = "/nfs/speed-scratch/z_amm/COEN490/Koala/ALPR/YOLOv8n_TEST"
    os.chdir(directory)

    im = cv2.imread(image_path)
    # im = upscale_img(im)
    assert im is not None, "file could not be read, check with os.path.exists()"
    imgray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(imgray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    blur = cv2.GaussianBlur(thresh,(5,5),0)
    th3 = cv2.threshold(blur,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)[1]
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Filtering contours
    license_plate_contour = []
    for cnt in contours:
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Define aspect ratio and size constraints
        aspect_ratio = w / float(h)
        if 1 < aspect_ratio < 6 and 13000 < cv2.contourArea(cnt) < 90000:  
            approx = cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True)
            # print(cv2.contourArea(cnt))
            # Check if it's a quadrilateral (4 corners)
            if 3 < len(approx) < 7:
                license_plate_contour.append(approx)
                # break  # Assuming only one plate, stop searching

    for cnt in contours:
        print(f"{cv2.contourArea(cnt)}")
    # Draw the detected license plate
    # if license_plate_contour is not None:
    rectangles_extracted = find_rect(license_plate_contour)
    warp_im = None
    for cnt in rectangles_extracted:
        is_rect, confidence = is_rectangle(cnt)
        print(f"{cnt}: is Rectangle? {is_rect}, Confidence Level: {confidence}")
        if confidence > 85: 
            cv2.drawContours(im, [cnt], -1, (0, 255, 0), 3)
            warp_im = straighten_image(cnt, im)
        
    # upscaled_image = upscale_baby(warp_im)
    print(license_plate_contour[0])
    
    print("Before saving image:")  
    print(os.listdir(directory))  

    cv2.imwrite("img_contour_out.jpg", im)
    cv2.imwrite("warp_im.jpg", warp_im)
    # cv2.imwrite("upscaled_img.jpg", upscaled_image)

image_path = '/speed-scratch/z_amm/COEN490/Koala/ALPR/YOLOv8n_TEST/cropped_outputs/cropped_object_1.jpg'
find_contours(image_path)