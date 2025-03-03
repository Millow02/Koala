import os
import cv2 
import numpy as np
from ultralytics import YOLO
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from alpr import crop_image_with_model_L, crop_image_with_model_S, rectify_images, ocr_letters, rectify_and_segment 
import threading
import shutil

def clear_folder(folder_path):
    """
    Removes all files and directories in the given folder.
    
    Args:
        folder_path (str): The path to the folder you want to clear.
    """
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            # Remove file or symbolic link
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            # Remove directory and its contents
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

def process_images(input_dir, localisation_model="./localisation_model.pt", segmentation_model="./segmentation_model.pt",  session_number=0):
    """
    Thread function to process images using license plate detection model
    
    Args:
        model_path (str): Path to YOLOv8 model weights
        input_dir (str): Directory containing input images
        session_number (int): Session identifier
        output_dir (str): Directory for saving cropped outputs
    """
    try:
        result_string = None
        result_string_ = None
        clear = 1
        #Localisation
        cropped_DIR = crop_image_with_model_L(localisation_model, input_dir)
        rectify_dir = None 
        # rectify_images(cropped_DIR)
        
        #Segmentation
        zoom=20
        if not os.listdir(rectify_dir):
            rectify_dir = cropped_DIR
            zoom = -5
        cropped_letters_dir = crop_image_with_model_S(segmentation_model, cropped_DIR, zoom=zoom)
        
        # OCR
        result_string = ocr_letters(cropped_letters_dir)
        
        # # OCR directly from Cropped Image and Rectified image
        # if not result_string or len(result_string) < 4:
        #     for image in os.listdir(cropped_DIR):
        #         image_path = os.path.join(cropped_DIR, image)
        #         result_string = rectify_and_segment(image_path)
        #
        # print(f"License Plate Detected! : {result_string}")
        user_input = input("Press Enter to continue...")
        if clear: 
            clear_folder(rectify_dir)
            clear_folder(cropped_letters_dir)
            clear_folder(cropped_DIR)
        return result_string

    except Exception as e:
        print(f"Error in processing thread: {str(e)}")


def process_images_sequentially(pics_folder="./pics", input_folder="./input_folder", localisation_model="./localisation_model.pt", segmentation_model="./segmentation_model.pt"):
    """
    Processes images one-by-one by:
      - Copying an image from the pics_folder to the input_folder.
      - Running the process_images function.
      - Clearing the input_folder before processing the next image.
    
    Args:
        pics_folder (str): Directory containing source images.
        input_folder (str): Directory where the current image will be placed.
        localisation_model (str): Path to the localisation model weights.
        segmentation_model (str): Path to the segmentation model weights.
    """

    clear_folder("./input_folder/")
    clear_folder("./rectified_outputs/session_number_0/")
    clear_folder("./cropped_outputs/session_number_0/")
    clear_folder("./segmentation_ouputs/session_number_0/")
    # Get a sorted list of image files from the pics_folder (you can modify the extensions as needed)
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
    image_files = sorted([f for f in os.listdir(pics_folder) if f.lower().endswith(valid_extensions)])
    
    for image_file in image_files:
        src_path = os.path.join(pics_folder, image_file)
        dst_path = os.path.join(input_folder, image_file)
        
        # Copy the image from the pics folder to the input folder.
        shutil.copy(src_path, dst_path)
        print(f"\nProcessing {image_file}...")
        
        # Run the processing pipeline on the input folder (which now contains one image)
        result = process_images(input_folder, localisation_model, segmentation_model)
        print(f"Result for {image_file}: {result}")
        
        # Clear the input folder for the next image.
        clear_folder(input_folder)

def main():
    """
    Main function to run the license plate detection pipeline
    """
    process_thread = threading.Thread(
        target=process_images_sequentially
    )
    process_thread.start()
    process_thread.join()

if __name__ == "__main__":
    main()
