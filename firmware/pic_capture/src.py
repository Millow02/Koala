import RPi.GPIO as GPIO
import time

# GPIO pin that we'll watch for a rising edge
GPIO_PIN = 17

def rising_edge_detected(channel):
    """
    Callback function that is called when a rising edge is detected.
    'channel' will be the pin number, e.g., 17.
    """
    print(f"Rising edge detected on GPIO {channel}!")

def main():
    # Use Broadcom (BCM) pin numbering
    GPIO.setmode(GPIO.BCM)

    # Set up the pin as input with a pull-down resistor
    GPIO.setup(GPIO_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

    # Add rising edge detection; attach the callback
    GPIO.add_event_detect(GPIO_PIN, GPIO.RISING, callback=rising_edge_detected, bouncetime=200)
    
    try:
        print(f"Listening for a rising edge on GPIO {GPIO_PIN}. Press Ctrl+C to exit.")
        # Keep the program running so the callback can be triggered
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        # Clean up GPIO resources
        GPIO.cleanup()
        print("GPIO cleanup complete. Exiting program.")

if __name__ == '__main__':
    main()

