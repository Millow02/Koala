import RPi.GPIO as GPIO
import time
from picamera2 import Picamera2
from datetime import datetime

# GPIO pins
TRIG_PIN = 23  # GPIO pin for trigger
ECHO_PIN = 24  # GPIO pin for echo

# Camera setup
def setup_camera():
    camera = Picamera2()
    camera.start()
    # Allow camera to warm up
    time.sleep(2)
    return camera

# Initialize GPIO
def setup_gpio():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(TRIG_PIN, GPIO.OUT)
    GPIO.setup(ECHO_PIN, GPIO.IN)
    GPIO.output(TRIG_PIN, False)
    time.sleep(2)  # Let sensor settle

# Get distance from sensor
def get_distance():
    # Send trigger pulse
    GPIO.output(TRIG_PIN, True)
    time.sleep(0.00001)
    GPIO.output(TRIG_PIN, False)
    
    # Get timing
    while GPIO.input(ECHO_PIN) == 0:
        pulse_start = time.time()
        
    while GPIO.input(ECHO_PIN) == 1:
        pulse_end = time.time()
    
    # Calculate distance
    pulse_duration = pulse_end - pulse_start
    distance = pulse_duration * 17150  # Speed of sound * time / 2
    distance = round(distance, 2)
    
    return distance

# Capture image
def capture_image(camera):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}.jpg"
    camera.capture_file(f"../pics/{filename}")
    print(f"Image captured: {filename}")

def main():
    try:
        # Setup
        setup_gpio()
        camera = setup_camera()
        trigger_distance = 30  # Distance in cm to trigger capture
        cooldown = 2  # Seconds between captures
        last_capture = 0
        
        print("System ready. Waiting for trigger...")
        
        while True:
            distance = get_distance()
            current_time = time.time()
            
            # Check if object is within trigger distance and cooldown period has passed
            if distance <= trigger_distance and (current_time - last_capture) >= cooldown:
                print(f"Object detected at {distance}cm")
                capture_image(camera)
                last_capture = current_time
            
            time.sleep(0.1)  # Small delay to prevent CPU overhead
            
    except KeyboardInterrupt:
        print("\nProgram stopped by user")
    finally:
        GPIO.cleanup()
        print("GPIO cleaned up")

if __name__ == "__main__":
    main()
