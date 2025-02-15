import cv2
import easyocr
import matplotlib.pyplot as plt

image_path = "C:/Users/niraj/OneDrive/Desktop/Koala/img/c44d319c-car_504_out_cropped_withgaussianblur.jpg"
img = cv2.imread(image_path)

reader = easyocr.Reader(['en'],gpu=False)

text = reader.readtext(img)

print(text)
