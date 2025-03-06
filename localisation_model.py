from ultralytics import YOLO

# Load YOLOv11 model
<<<<<<< HEAD
model = YOLO('C:/Users/niraj/Desktop/Koala/best_localisation.pt')
=======
model = YOLO('C:/Users/niraj/OneDrive/Desktop/Koala/best_localisation.pt')
>>>>>>> 1092e9e2ef451f632acc98269a629c15089272eb

model.export(format="ncnn")

#Save model ncnn format
model.save("C:/Users/niraj/OneDrive/Desktop/Koala/localisation_pi_model.ncnn")