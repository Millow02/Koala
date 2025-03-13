import RPi.GPIO as GPIO
import time
from picamera2 import Picamera2
from datetime import datetime


class UltraSonic:

    def __init__(self):
        # GPIO pins
        self.TRIG_PIN = 23  # GPIO pin for trigger
        self.ECHO_PIN = 24  # GPIO pin for echo
        


    # Initialize GPIO
    def setup_gpio(self):
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.TRIG_PIN, GPIO.OUT)
        GPIO.setup(self.ECHO_PIN, GPIO.IN)
        GPIO.output(self.TRIG_PIN, False)
        time.sleep(2)  # Let sensor settle

    # Get distance from sensor
    def get_distance(self):
        # Send trigger pulse
        GPIO.output(self.TRIG_PIN, True)
        time.sleep(0.00001)
        GPIO.output(self.TRIG_PIN, False)

        # Get timing
        while GPIO.input(self.ECHO_PIN) == 0:
            pulse_start = time.time()

        while GPIO.input(self.ECHO_PIN) == 1:
            pulse_end = time.time()

        # Calculate distance
        pulse_duration = pulse_end - pulse_start
        distance = pulse_duration * 17150  # Speed of sound * time / 2
        distance = round(distance, 2)

        return distance

class HCSR501:
    def __init__(self, pin):
        """
        Initialize the PIR sensor.
        :param pin: GPIO pin number where the PIR sensor is connected.
        """
        self.pin = pin
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

# Camera setup
def setup_camera():
    camera = Picamera2()
    camera.start()
    # Allow camera to warm up
    time.sleep(2)
    return camera

# Capture image
def capture_image(camera):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}.jpg"
    camera.capture_file(f"../../ALPR/demo/pics/{filename}")
    print(f"Image captured: {filename}")

def main():

    # Setup
    camera = setup_camera()
    pir = HCSR501(pin=4)  # Connect PIR sensor to GPIO 4
    try:

        print("System ready. Waiting for trigger...")

        while True:
            if pir.motion_detected():
                current_time = time.time()
                print(f"Time: {current_time}: Motion detected.")
                for _ in range(15):
                    capture_image(camera)
                    time.sleep(10)

            else:
                time.sleep(0.1)

        pir.cleanup()

    except KeyboardInterrupt:
        print("\nProgram stopped by user")
    finally:
        pir.cleanup()
        print("GPIO cleaned up")


if __name__ == "__main__":
    main()
