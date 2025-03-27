import RPi.GPIO as GPIO
import time
from picamera2 import Picamera2
from datetime import datetime
from sensors.pir import HCSR501
from sensors.camera import Camera
from sensors.light import LightSensor
from sync.cloud_sync import CloudSync
from utils.logger import logger
import os
import threading
import cv2
import numpy as np
import shutil

#============================== GLOBAL CONFIG ================================================
test_mode = 1
pir_frequency=2
PIR_pin=18
unprocessed_pics = "./pics1"
pics = "./pics2"
BLUR_THRESHOLD = 1  # Adjust this threshold based on testing
#============================== IMAGE PREPROCESSING ================================================

def process_images(stop_event):
    """
    Thread function to process images from pics1 folder:
    - Checks for blur using Laplacian variance
    - Deletes blurry images
    - Moves good quality images to pics2 folder
    """
    
    logger.info("Image processing thread starting...")
    
    # Ensure directories exist
    for directory in [unprocessed_pics, pics]:
        if not os.path.exists(directory):
            try:
                os.makedirs(directory)
                logger.info(f"Created directory: {directory}")
            except Exception as e:
                logger.error(f"Failed to create directory {directory}: {str(e)}")
                return

    while not stop_event.is_set():
        try:
            # Get list of images in unprocessed_pics folder
            files = os.listdir(unprocessed_pics)
            if files:  # Only log if there are files to process
                logger.debug(f"Found {len(files)} files in {unprocessed_pics}")
            
            for filename in files:
                if stop_event.is_set():
                    break
                    
                if not filename.endswith(('.jpg', '.jpeg', '.png')):
                    continue
                    
                image_path = os.path.join(unprocessed_pics, filename)
                if not os.path.exists(image_path):  # File might have been moved by another process
                    continue
                    
                try:
                    # Read image
                    image = cv2.imread(image_path)
                    if image is None:
                        logger.error(f"Could not read image: {filename}")
                        continue
                    
                    # Convert to grayscale
                    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                    
                    # Calculate Laplacian variance (blur metric)
                    blur_value = cv2.Laplacian(gray, cv2.CV_64F).var()
                    logger.debug(f"Image {filename} has blur value: {blur_value:.2f}")
                    
                    if blur_value < BLUR_THRESHOLD:
                        # Image is too blurry - delete it
                        os.remove(image_path)
                        logger.info(f"Deleted blurry image {filename} (blur value: {blur_value:.2f})")
                    else:
                        # Image is good - move to processed folder
                        destination = os.path.join(pics, filename)
                        shutil.move(image_path, destination)
                        logger.info(f"Moved good quality image {filename} to {destination} (blur value: {blur_value:.2f})")
                        
                except Exception as e:
                    logger.error(f"Error processing image {filename}: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error in process_images main loop: {str(e)}")
            
        time.sleep(1)  # Reduced polling frequency to once per second
        
    logger.info("Image processing thread stopping...")

#============================== SENSORS HANDLERS ================================================

def activate_image_burst(camera, stop_event, frequency=10):
    """
        @param frequency number of images required to be taken in 1 second.
    """
    time_period = float(1/frequency)
    for _ in range(frequency):
        if stop_event.is_set():
            break
        try:
            filename = f"{unprocessed_pics}/capture_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:-3]}.jpg"
            camera.capture_file(filename)
            logger.info(f"Image captured: {filename}")
        except Exception as e:
            logger.error(f"Error capturing image: {str(e)}")
        time.sleep(time_period)


def handle_pir_event(pir, camera, stop_event):
    """
    Handler for the PIR sensor event running in a separate thread.
    """

    while not stop_event.is_set():
        if test_mode:    
            try:
                start_time = 0
                if pir.motion_detected():
                    logger.info("Motion detected")
                    activate_image_burst(camera, stop_event, pir_frequency)
                    start_time = time.time()
                    logger.info(f"Motion detection started at: {start_time}")
                else:
                    current_time = time.time()
                    time_passed = current_time - start_time
                    logger.info("No motion detected")
                    logger.info(f"Time passed since last motion: {time_passed:.2f} seconds")
            except Exception as e:
                logger.error(f"Error in PIR handler: {str(e)}")
        else:
            try: 
                start_time = 0
                if pir.motion_detected():
                    logger.info("Motion detected")
                    start_time = time.time()
                    logger.info(f"Motion detection started at: {start_time}")
                else:
                    current_time = time.time()
                    time_passed = current_time - start_time
                    logger.info("No motion detected")
                    logger.info(f"Time passed since last motion: {time_passed:.2f} seconds")
            except Exception as e:
                logger.error(f"Error in PIR handler: {str(e)}")
        time.sleep(0.1)

def handle_ls_event(light_sensor, stop_event):
    """
    Handler for the light sensor event running in a separate thread.
    """

    while not stop_event.is_set():
        try:
            readings = light_sensor.read_values()
            logger.info(f"Light sensor readings: {readings}")
            time.sleep(1)
        except Exception as e:
            logger.error(f"Error in light sensor handler: {str(e)}")
        time.sleep(0.1)

#============================== RUNNABLE CODE ================================================

def run_stable_version(camera_1, pir, light_sensor, syncer, camera_2=None):
    stop_event = threading.Event()
    
    try:
        syncer.sync_folder(os.path.abspath(os.path.join(os.path.dirname(__file__), pics)))
        
        # Create and start sensor threads
        pir_thread = threading.Thread(target=handle_pir_event, args=(pir, camera_1.camera, stop_event))
        light_thread = threading.Thread(target=handle_ls_event, args=(light_sensor, stop_event))
        preprocess_thread = threading.Thread(target=process_images, args=(stop_event,), name="ImageProcessor")
        
        pir_thread.start()
        light_thread.start()
        preprocess_thread.start() 
        
        print("System ready. Waiting for trigger...")
        
        # Keep main thread alive
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nProgram stopped by user")
    finally:
        stop_event.set()
        pir_thread.join()
        light_thread.join()
        preprocess_thread.join()
        pir.cleanup()
        print("GPIO cleaned up")

def run_test_version(camera_1, pir, light_sensor, syncer, camera_2=None):
    """
    Simplified test version that checks basic functionality of all components
    """
    stop_event = threading.Event()
    pir_thread = None
    light_thread = None

    try:
        logger.info("Starting system test...")
        
        # Test component connectivity
        logger.info("Testing component connectivity...")
        logger.info(f"Camera connected: {camera_1.camera is not None}")
        logger.info(f"PIR sensor pin: {pir.pin}")
        logger.info(f"Light sensor channel: {light_sensor.channel}")
        
        # Test cloud sync connection
        try:
            cloud_connected = syncer.test_connection()
            logger.info(f"Cloud sync connection: {cloud_connected}")
        except Exception as e:
            logger.error(f"Cloud sync connection test failed: {str(e)}")
            cloud_connected = False
        
        # Start sensor threads
        pir_thread = threading.Thread(target=handle_pir_event, args=(pir, camera_1.camera, stop_event))
        light_thread = threading.Thread(target=handle_ls_event, args=(light_sensor, stop_event))
        preprocess_thread = threading.Thread(target=process_images, args=(stop_event,), name="ImageProcessor")

        pir_thread.start()
        light_thread.start()
        preprocess_thread.start() 
        
        # Run test for 60 seconds
        logger.info("Running sensor test for 60 seconds...")
        time.sleep(60)
        
    except KeyboardInterrupt:
        logger.warning("Test version stopped by user")
    except Exception as e:
        logger.error(f"Error in test version: {str(e)}")
    finally:
        stop_event.set()
        if pir_thread is not None:
            pir_thread.join()
        if light_thread is not None:
            light_thread.join()
        if preprocess_thread is not None:
            preprocess_thread.join()

        pir.cleanup()
        logger.info("Test completed - GPIO cleaned up")

#============================== MAIN ================================================

def main():
    camera_1 = Camera()
    camera = camera_1.setup_camera()
    pir = HCSR501(pin=PIR_pin)  
    light_sensor = LightSensor()
    syncer = CloudSync(
        hostname="root",
        ip_address="66.135.25.168",
        remote_folder="/root/Koala/ALPR/pics/",
        password="9Rh*M%eP?[=4y]NU"
    )

    if test_mode: 
        run_test_version(camera_1, pir, light_sensor, syncer) 
    else:
        run_stable_version(camera_1, pir, light_sensor, syncer) 

if __name__ == "__main__":
    main()
