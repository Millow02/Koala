import RPi.GPIO as GPIO
import time
from picamera2 import Picamera2
from datetime import datetime
from sensor.pir import HCSR501
from sensor.camera import Camera
from sensor.light import LightSensor
from sync.cloud_sync import CloudSync
from loguru import logger
import os
import threading

#============================== GLOBAL CONFIG ================================================
test_mode = 1
pir_frequency=2
#============================== SENSORS HANDLERS ================================================

def activate_image_burst(frequency=10):
    """
        @param frequency number of images required to be taken in 1 second.
    """
    time_period = (float) 1/frequency
    for _ in range(frequency):
        if stop_event.is_set():
            break
        camera.capture_file(f"capture_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:-3]}.jpg")
        time.sleep(time_period)


def handle_pir_event(pir, camera, stop_event):
    """
    Handler for the PIR sensor event running in a separate thread.
    """
    os.makedirs("logs", exist_ok=True)
    logger.add("logs/PIR.log", rotation="1 day")

    while not stop_event.is_set():
        if test_mode:    
            try:
                start_time = 0
                if pir.motion_detected():
                    logger.info("Motion detected")
                    activate_image_burst(pir_frequency)
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
    os.makedirs("logs", exist_ok=True)
    logger.add("logs/light_sensor.log", rotation="1 day")

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
        syncer.sync_folder("/path/to/local/folder")
        
        # Create and start sensor threads
        pir_thread = threading.Thread(target=handle_pir_event, args=(pir, camera_1.camera, stop_event))
        light_thread = threading.Thread(target=handle_ls_event, args=(light_sensor, stop_event))
        
        pir_thread.start()
        light_thread.start()
        
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
        pir.cleanup()
        print("GPIO cleaned up")

def run_test_version(camera_1, pir, light_sensor, syncer, camera_2=None):
    """
    Simplified test version that checks basic functionality of all components
    """
    os.makedirs("logs", exist_ok=True)
    logger.add("logs/test_run.log", rotation="1 day")
    stop_event = threading.Event()

    try:
        logger.info("Starting system test...")
        
        # Test component connectivity
        logger.info("Testing component connectivity...")
        logger.info(f"Camera connected: {camera_1.camera is not None}")
        logger.info(f"PIR sensor pin: {pir.pin}")
        logger.info(f"Light sensor channel: {light_sensor.channel}")
        logger.info(f"Cloud sync connection: {syncer.test_connection()}")
        
        # Start sensor threads
        pir_thread = threading.Thread(target=handle_pir_event, args=(pir, camera_1.camera, stop_event))
        light_thread = threading.Thread(target=handle_ls_event, args=(light_sensor, stop_event))
        
        pir_thread.start()
        light_thread.start()
        
        # Run test for 60 seconds
        logger.info("Running sensor test for 60 seconds...")
        time.sleep(60)
        
    except KeyboardInterrupt:
        logger.warning("Test version stopped by user")
    except Exception as e:
        logger.error(f"Error in test version: {str(e)}")
    finally:
        stop_event.set()
        pir_thread.join()
        light_thread.join()
        pir.cleanup()
        logger.info("Test completed - GPIO cleaned up")

#============================== MAIN ================================================

def main():
    camera_1 = Camera()
    camera = camera_1.setup_camera()
    pir = HCSR501(pin=4)  
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
