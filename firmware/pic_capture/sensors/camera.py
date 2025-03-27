from picamera2 import Picamera2
from datetime import datetime
import time
from loguru import logger
import os

# Ensure logs directory exists
os.makedirs("../logs", exist_ok=True)

# Configure logger
logger.add("logs/camera.log", rotation="10 MB", retention="1 week")

class Camera:
    def __init__(self):
        logger.info("Initializing Camera class")

    # Camera setup
    def setup_camera():
        logger.info("Setting up camera")
        camera = Picamera2()
        camera.start()
        # Allow camera to warm up
        time.sleep(2)
        logger.info("Camera setup complete")
        return camera

    # Capture image
    def capture_image(camera):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}.jpg"
        camera.capture_file(f"../../ALPR/pics/{filename}")
        logger.info(f"Image captured: {filename}")
        print(f"Image captured: {filename}")

