import RPi.GPIO as GPIO

class HCSR501:
    def __init__(self, pin):
        """
        Initialize the PIR sensor.
        :param pin: GPIO pin number where the PIR sensor is connected.
        """
        self.pin = pin
        self.camera = Camera()
        GPIO.setmode(GPIO.BCM)  # Use BCM GPIO numbering
        GPIO.setup(self.pin, GPIO.IN)  # Set pin as input

    def motion_detected(self):
        """
        Check if motion is detected.
        :return: True if motion is detected, False otherwise.
        """
        return GPIO.input(self.pin) == GPIO.HIGH

    def wait_for_motion(self, timeout=None):
        """
        Block until motion is detected or timeout is reached.
        :param timeout: Time in seconds to wait before giving up (None for indefinite wait).
        :return: True if motion is detected, False if timeout occurs.
        """
        start_time = time.time()
        while not self.motion_detected():
            if timeout and (time.time() - start_time) >= timeout:
                return False
            time.sleep(0.1)  # Small delay to avoid CPU overuse
        return True

    def cleanup(self):
        """ Clean up GPIO resources. """
        GPIO.cleanup()
