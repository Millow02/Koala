import cv2
import easyocr
import matplotlib.pyplot as plt

<<<<<<< HEAD
image_path = "C:/Users/niraj/OneDrive/Desktop/Koala/img/car1_out_cropped_zoomed.jpg"
=======
image_path = "C:/Users/niraj/OneDrive/Desktop/Koala/img/"
>>>>>>> e2d5095275ea7a46040c1b4b122b89c09db5e55b
img = cv2.imread(image_path)

reader = easyocr.Reader(['en'],gpu=False)

text = reader.readtext(img)

print(text)