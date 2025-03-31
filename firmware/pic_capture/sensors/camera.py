from picamera2 import Picamera2
from datetime import datetime
import time
from loguru import logger


class Camera:
    def __init__(self):
        logger.info("Initializing Camera class")
        self.camera = None

    # Camera setup
    def setup_camera(self):
        self.camera = Picamera2()
        config = picam2.create_still_configuration(main={"size": (1280, 720)})
        picam2.configure(config)
        self.camera.start()
        # Allow camera to warm up
        time.sleep(2)
        logger.info("Camera setup complete")
        return self.camera

    # Capture image
    def capture_image(self):
        if not self.camera:
            raise RuntimeError("Camera not set up. Call setup_camera() first.")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}.jpg"
        self.camera.capture_file(f"../../ALPR/pics/{filename}")
        logger.info(f"Image captured: {filename}")
        print(f"Image captured: {filename}")
