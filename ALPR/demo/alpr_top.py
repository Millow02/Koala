import os
import sys
import shutil
import time
import signal
import uuid
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Add the project root to sys.path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, project_root)

# Import our modularized ALPR classes
from alpr.localisation import Localisation
from alpr.rectification import Rectification
from alpr.segmentation import Segmentation
from alpr.ocr import OCR
from alpr.upscaler import Upscaler
from alpr.utils import starter_log, log, add_bp, test_manager

load_dotenv()

# Set up Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)  # type: ignore


# Flag to control the continuous processing
running = True


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    global running
    log("TOP", "Ctrl+C detected. Gracefully shutting down...")
    running = False


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
                log("TOP", f"Failed to delete {file_path}. Reason: {e}")


def upload_to_supabase(image_path, bucket_name="pictures"):
    """
    Uploads an image to Supabase storage and returns the URL.

    Args:
        image_path (str): Path to the image file
        bucket_name (str): Supabase storage bucket name

    Returns:
        str: URL of the uploaded image
    """
    try:
        # Generate a unique file name
        file_name = f"{uuid.uuid4()}{os.path.splitext(image_path)[1]}"

        # Read the file
        with open(image_path, "rb") as f:
            file_data = f.read()

        # Upload to Supabase
        response = supabase.storage.from_(bucket_name).upload(
            file_name, file_data, {"content-type": "image/jpeg"}
        )

        # Get the public URL
        file_url = supabase.storage.from_(bucket_name).get_public_url(file_name)

        log("TOP", f"Image uploaded to Supabase: {file_url}")
        return file_url

    except Exception as e:
        log("TOP", f"Error uploading to Supabase: {str(e)}")
        return None


def save_to_database(license_plate, image_url, camera_id=1):
    """
    Saves the license plate data to the OccupancyEvent table.

    Args:
        license_plate (str): The detected license plate
        image_url (str): URL of the uploaded image
        camera_id (int): ID of the camera that captured the image

    Returns:
        bool: Success status
    """
    try:
        # Insert into the OccupancyEvent table
        data = {
            "license_plate": license_plate,
            "status": "Unprocessed",
            "cameraId": camera_id,
            "image": image_url,
        }

        response = supabase.table("OccupancyEvent").insert(data).execute()
        log("TOP", f"Data saved to database: {license_plate}")
        log("TOP", f"Response from supabase: {response}")
        return True

    except Exception as e:
        log("TOP", f"Error saving to database: {str(e)}")
        return False


def process_images(
    input_dir,
    localisation_model,
    segmentation_model,
    sr_model,
    ocr_model,
    session_number=0,
    cropped_paddings=[-5, -10, 0, 10, 20],
):
    """
    Processes images using the ALPR pipeline by performing:
      - Localisation (plate detection and cropping)
      - Rectification (plate straightening)
      - Segmentation (character extraction)
      - OCR (character recognition)

    Args:
        input_dir (str): Directory or path for the input image.
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
        tm = test_manager()
        upscaler_ = Upscaler(sr_model)
        localiser = Localisation(localisation_model)
        rectifier = Rectification(upscaler_, tm)
        segmenter = Segmentation(segmentation_model, upscaler_)
        # ocr_engine = OCR(ocr_model)

        # Directories for intermediate outputs
        cropped_dir = f"./output/cropped/session_{session_number}"
        rectified_dir = f"./output/rectified/session_{session_number}"
        segmented_dir = f"./output/segmented/session_{session_number}"

        # Create required directories
        os.makedirs(cropped_dir, exist_ok=True)
        os.makedirs(rectified_dir, exist_ok=True)
        os.makedirs(segmented_dir, exist_ok=True)

        # --- Localisation: Crop license plates from the input image(s) ---
        log("TOP", f"Beginning localisation for input image at {input_dir}")

        localiser.set_directories(input_dir, cropped_dir)

        cropped_directories = localiser.crop_license_plate(
            padding_levels=cropped_paddings
        )

        log("TOP", "Post Localisation Report!")
        log("TOP", f"Cropped Directories: {cropped_directories}")

        # --- Rectification: Straighten each cropped license plate image ---
        rectifier.set_directories(cropped_directories, rectified_dir)
        score = rectifier.rectify()

        # --- Segmentation : Segment each character ---
        segmenter.set_directories(
            cropped_dir=cropped_directories,
            rectified_dir=rectified_dir,
            output_dir=segmented_dir,
        )
        license_plate = segmenter.segment()

        # Optionally clear intermediate folders after processing
        for crop_dir in cropped_directories:
            ensure_and_clear_folder(crop_dir)
        ensure_and_clear_folder(rectified_dir)
        ensure_and_clear_folder(segmented_dir)

        log("TOP", "Cleared all the folders, proceeding with next step.")
        log("TOP", "-----------------------------------------------\n")
        return license_plate

    except Exception as e:
        log("TOP", f"Error in processing thread: {str(e)}")
        return None


def process_images_continuously(
    pics_folder="./pics",
    input_folder="./input",
    localisation_model="./models/localisation_model.pt",
    segmentation_model="./models/best_segment_model.pt",
    sr_model="./models/LapSRN_x2.pb",
    ocr_model="./models/ocr_model.h5",
):
    """
    Continuously monitors the pics folder and processes new images.

    Args:
        pics_folder (str): Directory containing source images.
        input_folder (str): Directory where the current image will be placed.
        localisation_model (str): Path to the localisation model weights.
        segmentation_model (str): Path to the segmentation model weights.
        sr_model (str): Path to the super resolution model.
        ocr_model (str): Path to the OCR model.
    """
    # Clear directories for a fresh start
    ensure_and_clear_folder(input_folder)
    ensure_and_clear_folder("./output/cropped/session_0/")
    ensure_and_clear_folder("./output/segmented/session_0/")
    ensure_and_clear_folder("./output/rectified/session_0/")

    # Set to keep track of processed images
    processed_images = set()

    global running
    while running:
        try:
            # Get all image files in the pics folder
            valid_extensions = (".jpg", ".jpeg", ".png", ".bmp")
            image_files = [
                f
                for f in os.listdir(pics_folder)
                if f.lower().endswith(valid_extensions) and f not in processed_images
            ]

            if not image_files:
                log("TOP", "No new images to process. Waiting...")
                time.sleep(1)  # Wait before checking again
                continue

            # Process each new image
            for image_file in image_files:
                src_path = os.path.join(pics_folder, image_file)
                dst_path = os.path.join(input_folder, image_file)

                # Copy image from pics_folder to input_folder
                shutil.copy(src_path, dst_path)
                log("TOP", "=" * 100)
                log("TOP", f"Processing {image_file}...")

                # Process the current image
                license_plate = process_images(
                    dst_path,
                    localisation_model,
                    segmentation_model,
                    sr_model,
                    ocr_model,
                )

                if license_plate:
                    log("TOP", f"Result for {image_file}: {license_plate}")

                    # Upload the image to Supabase storage
                    image_url = upload_to_supabase(src_path)

                    if image_url:
                        # Save the result to the database
                        save_to_database(license_plate, image_url)
                else:
                    log("TOP", f"Failed to process {image_file}")

                # Mark as processed
                processed_images.add(image_file)

                # Clear the input folder for the next image
                ensure_and_clear_folder(input_folder)

            # Prevent the set from growing too large - keep the last 1000 processed images
            if len(processed_images) > 1000:
                processed_images = set(list(processed_images)[-1000:])

        except Exception as e:
            log("TOP", f"Error in continuous processing: {str(e)}")
            time.sleep(10)  # Wait a bit longer after an error


def main():
    """
    Main function to run the license plate detection pipeline continuously.
    """
    # Register the signal handler for Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)

    starter_log()
    log("TOP", "Starting continuous image processing. Press Ctrl+C to stop.")

    try:
        process_images_continuously()
    except KeyboardInterrupt:
        log("TOP", "Exiting due to user interrupt.")
    except Exception as e:
        log("TOP", f"Unhandled exception: {str(e)}")
    finally:
        log("TOP", "Image processing stopped.")


if __name__ == "__main__":
    main()
