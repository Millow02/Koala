from ultralytics import YOLO

# Load a YOLO11n PyTorch model
model = YOLO("C:/Users/niraj/OneDrive/Desktop/Koala/localization_model.pt")

# Export the model to NCNN format
model.export(format="ncnn")  
