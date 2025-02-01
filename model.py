from ultralytics import YOLO

# Load YOLOv11 model
model = YOLO('yolo11n.pt')

# Train the model with custom dataset
results = model.train(data='config.yaml', epochs=1)