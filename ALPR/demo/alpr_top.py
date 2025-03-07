import os
import cv2
import threading
import shutil

# Import our modularized ALPR classes
from alpr.localisation import Localisation
from alpr.rectification import Rectification
from alpr.segmentation import Segmentation
from alpr.ocr import OCR

def ensure_and_clear_folder(folder_path):
    """
    Ensures that the folder exists. If it does, clears its contents.
    
    Args:
        folder_path (str): Path to the folder.
    """
    # Create the folder if it doesn't exist
    if not os.path.exists(folder_path):
        os.makedirs(folder_path, exist_ok=True)
    else:
        # Clear all files and subdirectories
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f"Failed to delete {file_path}. Reason: {e}")

def process_images(input_dir, localisation_model, segmentation_model, sr_model, ocr_model, session_number=0):
    """
    Processes images using the ALPR pipeline by performing:
      - Localisation (plate detection and cropping)
      - Rectification (plate straightening)
      - Segmentation (character extraction)
      - OCR (character recognition)
    
    Args:
        input_dir (str): Directory containing input images.
        localisation_model (str): Path to the localisation YOLO model.
        segmentation_model (str): Path to the segmentation YOLO model.
        sr_model (str): Path to the super resolution model used in rectification.
        ocr_model (str): Path to the OCR Keras model.
        session_number (int): Identifier for the processing session.
    
    Returns:
        str: The recognized license plate text.
    """
    try:
        # Instantiate ALPR components
        localiser = Localisation(localisation_model)
        rectifier = Rectification(sr_model)
        segmenter = Segmentation(segmentation_model)
        ocr_engine = OCR(ocr_model)
        
        # Directories for intermediate outputs
        cropped_dir = f"./output/cropped/session_{session_number}"
        rectified_dir = f"./output/rectified/session_{session_number}"
        segmented_dir = f"./output/segmented/session_{session_number}"
        
        # Create required directories
        os.makedirs(cropped_dir, exist_ok=True)
        os.makedirs(rectified_dir, exist_ok=True)
        os.makedirs(segmented_dir, exist_ok=True)
        
        # --- Localisation: Crop license plates from the input image(s) ---
        crops = localiser.crop_license_plate(input_dir, cropped_dir)
        
        # --- Rectification: Straighten each cropped license plate image ---
        for idx, crop in enumerate(crops):
            crop_filename = os.path.join(cropped_dir, f"crop_{idx+1}.jpg")
            image = cv2.imread(crop_filename)
            rectified = rectifier.rectify(image)
            if rectified is not None:
                rectified_filename = os.path.join(rectified_dir, f"rectified_{idx+1}.jpg")
                cv2.imwrite(rectified_filename, rectified)
        
        # --- Segmentation: Extract individual characters from rectified images ---
        for file in os.listdir(rectified_dir):
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                segmenter.segment_characters(rectified_path, segmented_dir)
        
        # --- OCR: Recognize characters from segmented images ---
        segment_files = sorted([os.path.join(segmented_dir, f) 
                                for f in os.listdir(segmented_dir) 
                                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))])
        # Assume target size based on your OCR model's expected input; adjust if needed.
        recognized_text = ocr_engine.ocr_from_segments(segment_files)
        
        input("Press Enter to continue...")
        
        # Optionally clear intermediate folders after processing
        ensure_and_clear_folder(rectified_dir)
        ensure_and_clear_folder(segmented_dir)
        ensure_and_clear_folder(cropped_dir)
        
        return recognized_text

    except Exception as e:
        print(f"Error in processing thread: {str(e)}")
    
def process_images_sequentially(pics_folder="./pics", input_folder="./input",
                                localisation_model="/home/z4hed/COEN490/Koala/ALPR/models/localisation_model.pt",

                                segmentation_model="/home/z4hed/COEN490/Koala/ALPR/./models/segmentation_model.pt",
                                sr_model="/home/z4hed/COEN490/Koala/ALPR/models/LapSRN_x2.pb",
                                ocr_model="/home/z4hed/COEN490/Koala/ALPR/models/ocr_model.h5"):
    """
    Processes images sequentially by:
      - Copying each image from the pics_folder to the input_folder.
      - Running the ALPR pipeline on the input_folder.
      - Clearing the input_folder for the next image.
    
    Args:
        pics_folder (str): Directory containing source images.
        input_folder (str): Directory where the current image will be placed.
        localisation_model (str): Path to the localisation model weights.
        segmentation_model (str): Path to the segmentation model weights.
        sr_model (str): Path to the super resolution model.
        ocr_model (str): Path to the OCR model.
    """
    # Clear directories for a fresh start
    ensure_and_clear_folder("./output/cropped/session_0/")
    ensure_and_clear_folder("./output/segmented/session_0/")
    ensure_and_clear_folder("./output/rectified/session_0/")
    
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
    image_files = sorted([f for f in os.listdir(pics_folder) if f.lower().endswith(valid_extensions)])
    
    for image_file in image_files:
        src_path = os.path.join(pics_folder, image_file)
        dst_path = os.path.join(input_folder, image_file)
        
        # Copy image from pics_folder to input_folder
        shutil.copy(src_path, dst_path)
        print(f"\nProcessing {image_file}...")
        
        # Process the current image
        result = process_images(input_folder, localisation_model, segmentation_model, sr_model, ocr_model)
        print(f"Result for {image_file}: {result}")
        
        # Clear the input folder for the next image
        ensure_and_clear_folder(input_folder)

def main():
    """
    Main function to run the license plate detection pipeline.
    """
    process_thread = threading.Thread(target=process_images_sequentially)
    process_thread.start()
    process_thread.join()

if __name__ == "__main__":
    main()
