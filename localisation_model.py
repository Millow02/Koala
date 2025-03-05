from ultralytics import YOLO

# Load YOLOv11 model
model = YOLO('C:/Users/niraj/Desktop/Koala/runs/detect/train/weights/best.pt')

model.export(format="ncnn")

#Save model ncnn format
model.save("C:/Users/niraj/Desktop/Koala/localisation_pi_model.ncnn")