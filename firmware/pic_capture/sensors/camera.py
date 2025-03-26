

class Camera:
    def __init__(self):

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
        camera.capture_file(f"../../ALPR/pics/{filename}")
        print(f"Image captured: {filename}")
