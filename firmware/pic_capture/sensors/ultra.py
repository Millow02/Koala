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
