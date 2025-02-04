import cv2
import easyocr
import matplotlib.pyplot as plt

image_path = "C:/Users/niraj/OneDrive/Desktop/Koala/char_0.png"
img = cv2.imread(image_path)

reader = easyocr.Reader(['en'],gpu=False)

text = reader.readtext(img)

print(text)