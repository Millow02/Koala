import RPi.GPIO as GPIO
import time
import os
import cv2
import tempfile
import subprocess
from datetime import datetime
from picamera2 import Picamera2
from loguru import logger
import sys
import smbus2

# Global configuration
PIR_PIN = 18
BLUR_THRESHOLD = 1  # Adjust this threshold based on testing
PICS_DIR = "./pics"  # Directory for good quality pics


# Setup logger
def setup_logger():
    """Configure loguru logger with both file and console output"""

    # Create logs directory
    log_dir = os.path.join(os.path.dirname(__file__), "logs")
    os.makedirs(log_dir, exist_ok=True)

    # Remove any existing handlers
    logger.remove()

    # Add console handler with colored output
    logger.add(
        sys.stdout,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO",
    )

    # Add file handler for all logs
    logger.add(
        os.path.join(log_dir, "app.log"),
        rotation="10 MB",
        retention="1 week",
        compression="zip",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG",
        backtrace=True,
        diagnose=True,
    )

    # Add file handler for errors only
    logger.add(
        os.path.join(log_dir, "error.log"),
        rotation="10 MB",
        retention="1 week",
        compression="zip",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        backtrace=True,
        diagnose=True,
    )


# LTR329 constants for Light Sensor
_LTR329_ADDR = 0x29
_LTR329_ALS_CTRL = 0x80
_LTR329_ALS_MEAS_RATE = 0x85
_LTR329_ALS_DATA_CH1_0 = 0x88
_LTR329_ALS_DATA_CH1_1 = 0x89
_LTR329_ALS_DATA_CH0_0 = 0x8A
_LTR329_ALS_DATA_CH0_1 = 0x8B


# Camera class
class Camera:
    def __init__(self):
        logger.info("Initializing Camera class")
        self.camera = None

    def setup_camera(self):
        self.camera = Picamera2()
        self.camera.start()
        # Allow camera to warm up
        time.sleep(2)
        logger.info("Camera setup complete")
        return self.camera

    def capture_image(self, file_path):
        if not self.camera:
            raise RuntimeError("Camera not set up. Call setup_camera() first.")
        self.camera.capture_file(file_path)
        logger.info(f"Image captured: {file_path}")
        return True


# PIR motion sensor class
class HCSR501:
    def __init__(self, pin):
        """
        Initialize the PIR sensor.
        :param pin: GPIO pin number where the PIR sensor is connected.
        """
        self.pin = pin
        try:
            GPIO.setmode(GPIO.BCM)  # Use BCM GPIO numbering
            GPIO.setup(self.pin, GPIO.IN)  # Set pin as input
            logger.info(f"PIR sensor initialized on pin {pin}")
            logger.info("PIR sensor warming up...")
            time.sleep(3)  # Allow sensor to stabilize
            logger.info("PIR sensor ready")
        except Exception as e:
            logger.error(f"Failed to initialize PIR sensor on pin {pin}: {str(e)}")
            raise

    def motion_detected(self):
        """
        Check if motion is detected.
        :return: True if motion is detected, False otherwise.
        """
        try:
            return GPIO.input(self.pin) == GPIO.HIGH
        except Exception as e:
            logger.error(f"Error checking motion detection: {str(e)}")
            return False

    def cleanup(self):
        """Clean up GPIO resources."""
        try:
            GPIO.cleanup()
            logger.info("GPIO resources cleaned up")
        except Exception as e:
            logger.error(f"Error during GPIO cleanup: {str(e)}")


# Light sensor class
class LightSensor:
    def __init__(self, threshold=100, channel=1):
        """Initialize the light sensor."""
        self.channel = channel
        self.bus = smbus2.SMBus(channel)
        self.threshold = threshold

        # Initialize the sensor
        time.sleep(0.1)  # sensor takes 100ms to 'boot' on power up

        # Configure sensor
        self.bus.write_byte_data(_LTR329_ADDR, _LTR329_ALS_CTRL, 0x01)  # Active mode
        self.bus.write_byte_data(
            _LTR329_ADDR, _LTR329_ALS_MEAS_RATE, 0x03
        )  # 500ms integration time

    def _read_als_data(self):
        """Read the ALS data registers and calculate light values."""
        # Read the four bytes of ALS data
        ch1_0 = self.bus.read_byte_data(_LTR329_ADDR, _LTR329_ALS_DATA_CH1_0)
        ch1_1 = self.bus.read_byte_data(_LTR329_ADDR, _LTR329_ALS_DATA_CH1_1)
        ch0_0 = self.bus.read_byte_data(_LTR329_ADDR, _LTR329_ALS_DATA_CH0_0)
        ch0_1 = self.bus.read_byte_data(_LTR329_ADDR, _LTR329_ALS_DATA_CH0_1)

        # Combine bytes into 16-bit values
        ch1 = (ch1_1 << 8) | ch1_0  # IR
        ch0 = (ch0_1 << 8) | ch0_0  # Visible + IR

        return ch0, ch1

    @property
    def visible_plus_ir(self):
        """Get visible plus infrared light reading."""
        ch0, _ = self._read_als_data()
        return ch0

    @property
    def ir_light(self):
        """Get infrared light reading."""
        _, ch1 = self._read_als_data()
        return ch1

    @property
    def is_dark(self):
        """Check if the light level is below threshold."""
        return self.visible_plus_ir < self.threshold

    def read_values(self):
        """Read all sensor values."""
        ch0, ch1 = self._read_als_data()
        return {
            "visible_plus_ir": ch0,
            "ir_light": ch1,
            "is_dark": ch0 < self.threshold,
        }


# Cloud sync class
class CloudSync:
    """Class to handle cloud synchronization using rsync."""

    def __init__(self, hostname, ip_address, remote_folder, password):
        """Initialize CloudSync with connection details."""
        self.hostname = hostname
        self.ip_address = ip_address
        self.remote_folder = remote_folder
        self.password = password

    def test_connection(self):
        """Test connection to remote server using SSH."""
        try:
            # Create temporary file for password
            with tempfile.NamedTemporaryFile(mode="w", delete=False) as temp:
                temp_path = temp.name
                temp.write(self.password)

            # Set secure permissions on password file
            os.chmod(temp_path, 0o600)

            cmd = [
                "sshpass",
                "-f",
                temp_path,
                "ssh",
                "-o",
                "StrictHostKeyChecking=no",
                f"{self.hostname}@{self.ip_address}",
                "echo 'Connection test successful'",
            ]

            try:
                result = subprocess.run(
                    cmd,
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=5,  # 5 second timeout
                )
                logger.success("Connection test successful")
                return True
            except subprocess.CalledProcessError as e:
                logger.error(f"Connection test failed with error: {e}")
                logger.error(f"Error output: {e.stderr}")
                return False
            finally:
                # Remove temporary password file
                os.unlink(temp_path)

        except Exception as e:
            logger.error(f"Connection test error: {str(e)}")
            return False

    def sync_file(self, source_file):
        """Rsync a single file to the remote server."""
        try:
            # Create temporary file for password
            with tempfile.NamedTemporaryFile(mode="w", delete=False) as temp:
                temp_path = temp.name
                temp.write(self.password)

            # Set secure permissions on password file
            os.chmod(temp_path, 0o600)

            cmd = [
                "sshpass",
                "-f",
                temp_path,
                "rsync",
                "-avz",
                "--progress",
                "-e",
                "ssh -o StrictHostKeyChecking=no",
                source_file,
                f"{self.hostname}@{self.ip_address}:{self.remote_folder}",
            ]

            try:
                result = subprocess.run(
                    cmd,
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                )

                if result.returncode == 0:
                    logger.success(f"File {source_file} synced successfully")
                    return True
                else:
                    logger.error(
                        f"File sync failed with return code {result.returncode}"
                    )
                    return False

            except subprocess.CalledProcessError as e:
                logger.error(f"Rsync failed with error: {e}")
                logger.error(f"Error output: {e.stderr}")
                return False
            finally:
                # Remove temporary password file
                os.unlink(temp_path)

        except Exception as e:
            logger.error(f"Error in sync_file: {str(e)}")
            return False


# Image processing function
def check_image_blur(image_path):
    """Check if an image is blurry using Laplacian variance."""
    try:
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not read image: {image_path}")
            return True, 0

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Calculate Laplacian variance (blur metric)
        blur_value = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Determine if image is blurry
        is_blurry = blur_value < BLUR_THRESHOLD

        logger.info(
            f"Image {os.path.basename(image_path)} blur value: {blur_value:.2f}"
        )

        return is_blurry, blur_value
    except Exception as e:
        logger.error(f"Error checking image blur: {str(e)}")
        return True, 0  # Assume blurry on error


def main():
    # Setup logger
    setup_logger()

    # Create pics directory if it doesn't exist
    if not os.path.exists(PICS_DIR):
        os.makedirs(PICS_DIR)
        logger.info(f"Created directory: {PICS_DIR}")

    # Initialize components
    logger.info("Initializing system components...")

    try:
        # Initialize camera
        camera = Camera()
        camera.setup_camera()

        # Initialize PIR sensor
        pir = HCSR501(pin=PIR_PIN)

        # Initialize light sensor
        light_sensor = LightSensor()

        # Initialize cloud sync
        syncer = CloudSync(
            hostname="root",
            ip_address="66.135.25.168",
            remote_folder="/root/Koala/ALPR/pics/",
            password="9Rh*M%eP?[=4y]NU",
        )

        # Test cloud connection
        syncer.test_connection()

        logger.info("System initialized and ready")

        # Main loop
        try:
            last_motion_time = 0
            motion_cooldown = 5  # seconds between captures

            while True:
                # Check for motion
                if pir.motion_detected():
                    current_time = time.time()

                    # Only process if we're not in cooldown period
                    if current_time - last_motion_time > motion_cooldown:
                        logger.info(
                            "Motion detected! Waiting 2 seconds before capture..."
                        )

                        # Wait 2 seconds
                        time.sleep(2)

                        # Generate timestamp and filename
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"capture_{timestamp}.jpg"
                        file_path = os.path.join(PICS_DIR, filename)

                        # Capture image
                        try:
                            camera.capture_image(file_path)

                            # Check if image is blurry
                            is_blurry, blur_value = check_image_blur(file_path)

                            if is_blurry:
                                logger.info(
                                    f"Image is blurry (blur value: {blur_value:.2f}). Deleting."
                                )
                                os.remove(file_path)
                            else:
                                logger.info(
                                    f"Image is clear (blur value: {blur_value:.2f}). Uploading to cloud."
                                )
                                # Upload to cloud
                                syncer.sync_file(file_path)

                            # Update last motion time
                            last_motion_time = current_time

                        except Exception as e:
                            logger.error(f"Error in capture process: {str(e)}")

                # Occasionally read and log light levels
                if int(time.time()) % 60 == 0:  # Once per minute
                    light_values = light_sensor.read_values()
                    logger.info(f"Light sensor readings: {light_values}")

                # Sleep to avoid excessive CPU usage
                time.sleep(0.1)

        except KeyboardInterrupt:
            logger.info("Program stopped by user")

    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")

    finally:
        # Clean up
        if "pir" in locals():
            pir.cleanup()
        logger.info("System shutdown complete")


if __name__ == "__main__":
    main()
