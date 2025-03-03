import os
import cv2 
import numpy as np
from ultralytics import YOLO
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from PIL import Image
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array


def darken_gray_pixels(bgr_image, threshold=15):
    """
    Darkens (sets to black) pixels in a BGR image that are nearly gray.
    
    A pixel is considered "gray" if the difference between its maximum
    and minimum channel values is less than the threshold.
    
    Args:
        bgr_image (np.array): Input image in BGR format.
        threshold (int): Threshold for determining if a pixel is gray.
                         Lower values make the criteria stricter.
    
    Returns:
        np.array: Modified image with gray pixels set to black.
    """
    # Ensure the image is a NumPy array
    bgr_image = np.asarray(bgr_image)
    
    # Calculate the range (peak-to-peak) of color values for each pixel
    # The range is the difference between the maximum and minimum values among B, G, and R.
    # np.ptp along axis=2 does exactly that.
    pixel_range = np.ptp(bgr_image, axis=2)
    
    # Create a mask where the pixel range is below the threshold (i.e., nearly gray)
    gray_mask = pixel_range < threshold
    
    # For pixels that are nearly gray, set them to black.
    # gray_mask has shape (height, width), so we index into the image accordingly.
    bgr_image[gray_mask] = [0, 0, 0]
    
    return bgr_image

def apply_vignette(image, kernel_scale=200):
    """
    Applies a vignette effect to the image by darkening the edges.

    Args:
        image (np.array): Input image (BGR format).
        kernel_scale (float): Standard deviation for the Gaussian kernel (controls the strength of the vignette).
                              Higher values result in a more subtle vignette.

    Returns:
        np.array: Image with vignette effect applied.
    """
    rows, cols = image.shape[:2]
    
    kernel_x = cv2.getGaussianKernel(cols, kernel_scale)
    kernel_y = cv2.getGaussianKernel(rows, kernel_scale)
    
    kernel = kernel_y * kernel_x.T
    mask = kernel / kernel.max()  # Normalize the mask to [0, 1]
    
    # If the image is colored, replicate the mask for each channel.
    vignette = np.empty_like(image, dtype=np.float32)
    for i in range(3):  # Assuming BGR
        vignette[:, :, i] = image[:, :, i] * mask

    # Convert the result to uint8
    vignette = np.clip(vignette, 0, 255).astype(np.uint8)
    return vignette

def ocr_letters(cropped_letters_dir):
    """
    Iterates over image files in cropped_letters_dir, performs OCR on each letter image,
    and returns the concatenated string.

    Args:
        cropped_letters_dir (str): Directory containing cropped letter images.
    
    Returns:
        str: The string resulting from OCR of each letter image.
    """
    # Define valid image extensions
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
    # Get list of image files sorted by filename (adjust if your naming convention implies order)
    image_files = sorted([
        f for f in os.listdir(cropped_letters_dir) if f.lower().endswith(valid_extensions)
    ])
    
    recognized_text = ""
    
    # Loop through each image and perform OCR
    for image_file in image_files:
        image_path = os.path.join(cropped_letters_dir, image_file)
        try:
            # Optional: adjust pytesseract config if each image is a single letter.
            # --psm 10: treat the image as a single character.
            # tessedit_char_whitelist: limits the recognized characters to those provided.
            config = '--psm 10 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            letter = predict_letter(image_path)
            # Strip any whitespace/newlines
            recognized_text += letter.strip()
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
    
    return recognized_text

def crop_image_with_model_L(model_path, input_dir, session_number=0, output_dir='cropped_outputs'):
    """
    Processes images using a YOLOv8 model to detect and crop license plates from images.
    
    Args:
        model_path (str): Path to the YOLOv8 model weights (.pt file)
            The model should be trained to detect license plates with classes:
            - LP (standard license plate)
            - LP, Obstructed (partially visible license plate)
            - LP, no vehicle (license plate without visible vehicle)
        
        input_dir (str): Directory containing the input images to process.
                        Supported formats: .jpg, .jpeg, .png, .bmp
                        Expected input image size: 640x480 or 640x640
        
        output_dir (str, optional): Directory where cropped license plates will be saved.
                                  Defaults to 'cropped_outputs'.
                                  A subdirectory will be created for each processed image.
        
        session_number (int, optional): Identifier for the processing session.
                                      Used to organize outputs from different runs.
    
    Returns:
        None: Results are saved directly to the output directory
    
    Model Details:
        - Architecture: YOLOv8n, YOLOv8n
        - Input Resolution: 640x640, 640x480
        - Confidence Threshold: 0.25
        - IOU Threshold: 0.45
        - Output: Bounding boxes for detected license plates
    """
    # Create the output directory if it does not exist
    output_dir = os.path.join(output_dir, f"session_number_{session_number}")
    os.makedirs(output_dir, exist_ok=True)
    # Load model
    model = YOLO(model_path)

    # Get list of image files in input directory
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
    image_files = [f for f in os.listdir(input_dir) if f.lower().endswith(valid_extensions)]
    
    for image_file in image_files:
        # Construct full image path
        image_path = os.path.join(input_dir, image_file)
        
        # Read the image
        image = cv2.imread(image_path)
        
        # Run inference on the image
        results = model.predict(source=image_path, conf=0.25, iou=0.45)
        
        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()

            for idx, box in enumerate(boxes):
                x1, y1, x2, y2 = map(int, box)
                cropped_image = image[y1-20:y2+20, x1-20:x2+20]
                # Create output path with filename
                output_path = os.path.join(output_dir, f'{os.path.splitext(image_file)[0]}_crop_{idx+1}.jpg')
                cv2.imwrite(output_path, cropped_image)
                print(f'Saved cropped image to {output_path}')
    return output_dir



def draw_contours(processed_img):
    # Find contours based on Edges
    cnts = cv2.findContours(processed_img.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)[0]
    cnts=sorted(cnts, key = cv2.contourArea, reverse = True)[:30] #sort contours based on their area keeping minimum required area as '30' (anything smaller than this will not be considered)
    NumberPlateCnt = None #we currently have no Number plate contour

    total_area = 640 * 640
    lower_bound_of_LP_area = total_area*0.2
    higher_bound_of_LP_area = total_area*0.8

    # loop over our contours to find the best possible approximate contour of number plate
    count = 0
    for c in cnts:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            # print(cv2.contourArea(c))
            # cv2.drawContours(img, [approx], -1, (0,255,0), 3)
            # if len(approx) == 4:
            #     print(len(approx))
            if len(approx) == 4 and cv2.contourArea(c) > lower_bound_of_LP_area and cv2.contourArea(c) < higher_bound_of_LP_area:  # Select contour with 4 corners and min area
                NumberPlateCnt = approx #This is our approx Number Plate Contour
                break
    return NumberPlateCnt

def generate_contours(image_path, no_plot=False): 

    # After reading the image, it is better to rescale it to 640x640
    # This improves performance slightly
    img = cv2.imread(image_path)
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel("LapSRN_x2.pb")
    sr.setModel("lapsrn", 2)
    img = sr.upsample(img)
    img = cv2.resize(img, (640, 640))

    # Display the original image
    fig, ax = plt.subplots(2, 2, figsize=(10,7))

    image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    processed_image = darken_gray_pixels(img, threshold=15)
    vignette = apply_vignette(img)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray_removed = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
    gray_vignette = cv2.cvtColor(vignette, cv2.COLOR_BGR2GRAY)

    filtered = cv2.bilateralFilter(gray, 9, 78, 40)
    filtered_vignette = cv2.bilateralFilter(gray, 9, 78, 40)

    def process_gray_images(filt):
        processed_images = []
        thresholds = [20, 50, 60, 70, 80, 90, 100, 110, 130, 150, 170, 190, 210]
        
        # Generate images with different thresholds
        for thresh in thresholds:
            _, thresh_img = cv2.threshold(filt, thresh, 255, cv2.THRESH_BINARY)
            processed_images.append(thresh_img)
            
        return processed_images
    processed_grays = process_gray_images(filtered)
    processed_grays_v = process_gray_images(filtered_vignette)

    # Find Edges of the grayscale image
    edged = cv2.Canny(gray, 100, 180)

    invGamma = 0.5
    table = np.array([((i / 255.0) ** invGamma) * 255 for i in range(256)]).astype("uint8")
    gamma = cv2.LUT(image, table)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    gray_enhanced = clahe.apply(gray)

    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    laplacian = cv2.Laplacian(blurred, cv2.CV_64F)
    abs_laplacian = cv2.convertScaleAbs(laplacian)

    output_contour = []

    def plot_contour(test_input):
        NumberPlateCnt = draw_contours(test_input)
        if NumberPlateCnt is not None:
            cv2.drawContours(img, [NumberPlateCnt], -1, (0,255,0), 3)
            output_contour.append(NumberPlateCnt)

    plot_contour(gray)
    plot_contour(gray_enhanced)
    plot_contour(gray_vignette)
    plot_contour(gray_removed)
    plot_contour(filtered)
    plot_contour(filtered_vignette)
    plot_contour(abs_laplacian)
    plot_contour(edged)

    for g in processed_grays: 
        plot_contour(g)
    for g_v in processed_grays_v:
        plot_contour(g_v)


    # # Draw Canny edges from processed grays. 
    # for c in canny_gray_edges: 
    #     NumberPlateCnt = draw_contours(c)
    #     if NumberPlateCnt is not None:
    #         cv2.drawContours(img, [NumberPlateCnt], -1, (0,255,0), 3)
    #         output_contour.append(NumberPlateCnt)

    if not no_plot:
        ax[0,0].imshow(image)
        ax[0,0].set_title('Original Image')

        ax[0,1].imshow(gray, cmap='gray')
        ax[0,1].set_title('Grayscale Conversion')
        
        ax[1,0].imshow(processed_grays[1], cmap='gray')  # Show middle threshold
        ax[1,0].set_title('Bilateral Filter & Thresholding')

        ax[1,1].imshow(edged, cmap='gray')
        ax[1,1].set_title('Canny Edges')

        fig.tight_layout()
        plt.show()
        
        plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        plt.title("Detected license plate")
        plt.show()

    return image, output_contour 

    


def restructure_array(arr):
    """
    Takes an indivitual set of points and returns the correct format required for the rectangle detector
    """
    return [point[0].tolist() for point in arr]

def order_points(pts):
    """
    Orders a list of four points in the following order:
    top-left, top-right, bottom-right, bottom-left.
    """
    pts = np.array(pts, dtype="float32")
    rect = np.zeros((4, 2), dtype="float32")
    
    # The top-left point will have the smallest sum,
    # the bottom-right will have the largest sum.
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    
    # The top-right point will have the smallest difference,
    # the bottom-left will have the largest difference.
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    
    return rect

def straighten_image(src_pts, image):
    """
    Last step: Performing a Homography Transform
    """
    # Get the size of the output image
    height, width = 400, 794  # Set the desired output size

    src_pts = np.float32(restructure_array(src_pts))
    src_pts = order_points(src_pts)
    # src_pts =  np.float32([point[:2] for point in src_pts]) # Convert to NumPy array
    print(src_pts)
    # Define four destination points (where the corners should be mapped)
    dst_pts = np.float32([
        [0, 0],           # top-left
        [width, 0],       # top-right
        [width, height],  # bottom-right
        [0, height]       # bottom-left
    ])
    
    # Compute the homography matrix
    H, _ = cv2.findHomography(src_pts, dst_pts)
    
    
    # Apply perspective transformation (warp the image)
    warped_image = cv2.warpPerspective(image, H, (width, height))
    return warped_image



def rectify_images(input_dir, session_number=0, output_dir='rectified_outputs'):
    """
    Rectify and crop license plates from images in multiple input directories.
    """
    # Create the output directory if it does not exist
    output_dir = os.path.join(output_dir, f"session_number_{session_number}")
    os.makedirs(output_dir, exist_ok=True)

    # Get list of image files in input directory
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
    image_files = [f for f in os.listdir(input_dir) if f.lower().endswith(valid_extensions)]
    
    for image_file in image_files:
        # Construct full image path
        image_path = os.path.join(input_dir, image_file)
        
        try:
            # Process single image
            imagi, contours = generate_contours(image_path, True)
            if contours is not None:
                for cnt in contours:
                    imooge = straighten_image(cnt, imagi)
                    output_path = os.path.join(output_dir, f'{os.path.splitext(image_file)[0]}_rectified.jpg')
                    cv2.imwrite(output_path, imooge)
                    print(f"Processed: {image_file}")
        except Exception as e:
            print(f"Error processing {image_file}: {str(e)}")
            continue
    return output_dir


from openalpr import Alpr

def rectify_and_segment(plate_image,
                             country="us",
                             config="/etc/openalpr/openalpr.conf",
                             runtime_data="/usr/share/openalpr/runtime_data"):
    """
    Process a license plate image using OpenALPR and return the license plate number.
    
    Args:
        plate_image (str): Path to the license plate image file.
        country (str): Country code for the license plate. Default is "us".
        config (str): Path to the openalpr configuration file.
        runtime_data (str): Path to the OpenALPR runtime_data directory.
    
    Returns:
        str or None: The license plate number with the highest confidence for the first detected plate,
                     or None if no plate was detected.
    """
    alpr = None
    plate_number = None
    try:
        alpr = Alpr(country, config, runtime_data)
        if not alpr.is_loaded():
            print("Error loading OpenALPR")
            return None
        else:
            print("Using OpenALPR " + alpr.get_version())
        
        # Configure OpenALPR settings
        alpr.set_top_n(7)
        alpr.set_default_region("wa")
        alpr.set_detect_region(False)
        
        # Read image bytes from the file
        with open(plate_image, "rb") as f:
            jpeg_bytes = f.read()
        
        # Recognize the plate from the image bytes
        results = alpr.recognize_array(jpeg_bytes)
        
        for plate in results['results']:
            for candidate in plate['candidates']:
                plate_number = candidate['plate']
                break;
        else:
            print("No license plate detected.")
    
    except Exception as e:
        print("Error during OpenALPR processing:", e)
    finally:
        if alpr:
            alpr.unload()
    
    # print(f"Plate Number Detected in direct segmentation output: {plate_number}")
    return plate_number


def crop_image_with_model_S(model_path, input_dir,zoom=20, session_number=0, output_dir='segmentation_ouputs'):
    """
    Crops license plates from images using a YOLOv8 model.
    
    Parameters:
        model_path (str): Path to the trained YOLOv8 model weights (.pt file)
        input_dir (str): Directory containing images to process 
        session_number (int): Session identifier number
        output_dir (str): Output directory for cropped plates (default: 'segmentation_outputs')
    
    Notes:
        - Uses YOLOv8n model trained on license plate detection
        - Handles standard plates, partially obstructed plates, and plates without vehicle
        - Input images should be 640x480 or 640x640 resolution
        - Supported formats: .jpg, .jpeg, .png, .bmp
        - Model uses 0.25 confidence threshold and 0.45 IOU threshold
        - Cropped plates are saved to session-specific subdirectories
    """
    # Create the output directory if it does not exist
    output_dir = os.path.join(output_dir, f"session_number_{session_number}")
    os.makedirs(output_dir, exist_ok=True)
    # Load model
    model = YOLO(model_path)

    # Get list of image files in input directory
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
    image_files = [f for f in os.listdir(input_dir) if f.lower().endswith(valid_extensions)]
    
    for image_file in image_files:
        # Construct full image path
        image_path = os.path.join(input_dir, image_file)
        
        # Read the image
        image = cv2.imread(image_path)
        
        # Run inference on the image
        results = model.predict(source=image_path) # Optional: When you improve the model,Set IoU threshold of 45% or 60%
        
        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            labels = result.boxes.cls.cpu().numpy()

            for idx, box in enumerate(boxes):
                x1, y1, x2, y2 = map(int, box)
                cropped_image = image[y1-zoom:y2+zoom, x1-zoom:x2+zoom]
                # Create output path with filename
                output_path = os.path.join(output_dir, f'{os.path.splitext(image_file)[0]}_crop_{labels[idx]}.jpg')
                cv2.imwrite(output_path, cropped_image)
                print(f'Saved cropped image to {output_path}')
    return output_dir

def predict_letter(image_path, model_path="./ocr_model.h5"):
    """
    Loads a Keras model (in .h5 format) from 'model_path', then preprocesses
    the image at 'image_path' and returns the predicted letter as a string.

    Args:
        model_path (str): Path to the .h5 model file.
        image_path (str): Path to the image to be predicted.
    
    Returns:
        str: The predicted character/letter.
    """
    # Adjust these based on your model's expected input shape

    class_labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
                    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

    # 1. Load the model
    model = tf.keras.models.load_model(model_path)
    _, expected_height, expected_width, _ = model.input_shape
    # 2. Load and preprocess the image
    #    - resize to the input shape
    #    - convert to array
    #    - scale pixel values to [0,1] if needed
    image = load_img(image_path, target_size=(expected_height, expected_width), color_mode='rgb')
    image_array = img_to_array(image)
    image_array = np.expand_dims(image_array, axis=0)  # batch dimension
    image_array = image_array / 255.0                  # normalize to 0-1

    # 3. Predict using the model
    predictions = model.predict(image_array)  # shape: (1, number_of_classes)
    predicted_class_index = np.argmax(predictions[0])

    # 4. Map the predicted class index to the corresponding label
    predicted_letter = class_labels[predicted_class_index]

    return predicted_letter




