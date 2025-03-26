import RPi.GPIO as GPIO
import time
from picamera2 import Picamera2
from datetime import datetime
from sensor.pir import HCSR501
from sensor.camera import Camera

def main():

    # Setup
    camera_1 = Camera()
    camera = camera_1.setup_camera()
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
