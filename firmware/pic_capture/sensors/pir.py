import RPi.GPIO as GPIO
import time
from loguru import logger
from .camera import Camera

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
            begin_time = time.time()
            while time.time() - begin_time < 3:
                time_left = begin_time + 60 - time.time()
                print(f"PIR sensor warming up! Done in {time_left:.1f} s.", end='\r')
            logger.info(f"PIR sensor initialized on pin {pin}")
        except Exception as e:
            logger.error(f"Failed to initialize PIR sensor on pin {pin}: {str(e)}")
            raise

    def motion_detected(self):
        """
        Check if motion is detected.
        :return: True if motion is detected, False otherwise.
        """
        try:
            motion = GPIO.input(self.pin) == GPIO.HIGH
            if motion:
                logger.info("Motion detected")
            return motion
        except Exception as e:
            logger.error(f"Error checking motion detection: {str(e)}")
            return False

    def wait_for_motion(self, timeout=0.5):
        """
        Block until motion is detected or timeout is reached.
        :param timeout: Time in seconds to wait before giving up (None for indefinite wait).
        :return: True if motion is detected, False if timeout occurs.
        """
        try:
            start_time = time.time()
            logger.info(f"Waiting for motion (timeout: {timeout if timeout else 'indefinite'})")
            while not self.motion_detected():
                if timeout and (time.time() - start_time) >= timeout:
                    logger.info("Motion detection timeout reached")
                    return False
                time.sleep(0.1)  # Small delay to avoid CPU overuse
            logger.info("Motion detected after waiting")
            return True
        except Exception as e:
            logger.error(f"Error while waiting for motion: {str(e)}")
            return False

    def cleanup(self):
        """ Clean up GPIO resources. """
        try:
            GPIO.cleanup()
            logger.info("GPIO resources cleaned up")
        except Exception as e:
            logger.error(f"Error during GPIO cleanup: {str(e)}")
