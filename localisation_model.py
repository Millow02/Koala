from ultralytics import YOLO

# Load YOLOv11 model
model = YOLO('C:/Users/niraj/Desktop/Koala/best_localisation.pt')

model.export(format="ncnn")

#Save model ncnn format
model.save("C:/Users/niraj/OneDrive/Desktop/Koala/localisation_pi_model.ncnn")