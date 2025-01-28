import RPi.GPIO as GPIO  


def main():
    GPIO.setmode(GPIO.BOARD)  
      
    GPIO.setup(13, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)  

    def camera_capture_callback(channel):  
        pass
      
    # We might not need to add debounce as the IO tend to be quick ?
    # TODO: Do some research into this
    GPIO.add_event_detect(13, GPIO.RISING, callback=camera_capture_callback)  
      
    GPIO.cleanup()           # clean up GPIO on normal exit  

    print("pic_capture service has shutdown")


if __name__ == "__main__":
    main()
