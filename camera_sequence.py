
import os
from picamera2 import Picamera2
from time import sleep

# Initialize PiCamera
camera = Picamera2()

# Capture image from PiCamera
image_folder = './img'
if not os.path.exists(image_folder):
    os.makedirs(image_folder)
image_path = os.path.join(image_folder, 'captured_plate.jpg')


camera.start()
camera.capture_file(image_path)
