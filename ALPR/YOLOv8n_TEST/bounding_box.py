from ultralytics import YOLO

def detect_LP_YOLOv8n():
    model = YOLO('yolov8n.pt')
    # Train the model
    results = model.train(
        data='my_custom_data.yaml',  # Path to your dataset config file
        epochs=50,
        imgsz=640,
        batch=16,
        lr0=1e-3,
        device=0,
        freeze=10,  # Freeze the first 10 layers of the backbone
        project='my_project',  # Custom project folder (will create 'runs/detect/my_project')
        name='exp1',         # Custom experiment name (will create 'runs/detect/my_project/exp1')
        exist_ok=True        # Overwrite existing directory if needed
    )

    metrics = model.val(data='my_custom_data.yaml', plots=True)
    # Assuming training is complete and your model has been updated:
    # Save the final model weights to a specific file.
    model.model.save("trained_model_bb.pt")

def crop_image_with_mode(model_path, image_path):
    # model_path = 'COEN490/Koala/ALPR/YOLOv8n_TEST/my_project/exp1/weights/best.pt'
    model = YOLO(model_path)

    # Read the image using cv2
    # (Note: cv2 reads images in BGR format by default)
    image = cv2.imread(image_path)
    
    # Run inference (prediction) on the image
    # The results returned is a list of results (one per image in the batch)
    results = model.predict(source=image_path, conf=0.25, iou=0.45)
    
    for result in results:
        # The 'boxes' attribute contains the bounding boxes.
        # The .xyxy attribute returns the bounding boxes in [x1, y1, x2, y2] format.
        boxes = result.boxes.xyxy.cpu().numpy()  # Convert to NumPy array if on GPU
    
        # Loop through each detected bounding box
        for idx, box in enumerate(boxes):
            # Extract coordinates and cast them to integer
            x1, y1, x2, y2 = map(int, box)
            
            # Crop the image using the bounding box coordinates
            # Note: image is a NumPy array with shape (height, width, channels)
            cropped_image = image[y1:y2, x1:x2]
            # Define a filename for the cropped image
            output_path = os.path.join(output_dir, f'cropped_object_{idx+1}.jpg')
            
            # Save the cropped image using cv2.imwrite
            cv2.imwrite(output_path, cropped_image)
            print(f'Saved cropped image to {output_path}')

def crop_img():
    mod_path = "/speed-scratch/z_amm/COEN490/Koala/ALPR/YOLOv8n_TEST/my_project/exp1/weights/best.pt"
    image_path = '/speed-scratch/z_amm/COEN490/Koala/ALPR/YOLOv8n_TEST/datasets/other/img.jpg'
    crop_image_with_mode(mod_path, image_path)

def find_contours(image_path):
    """
        Finds the contours(edges) of cropped license plate
    """
    directory = "/nfs/speed-scratch/z_amm/COEN490/Koala/ALPR/YOLOv8n_TEST"
    os.chdir(directory)

    im = cv2.imread(image_path)
    assert im is not None, "file could not be read, check with os.path.exists()"
    imgray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(imgray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    blur = cv2.GaussianBlur(thresh,(5,5),0)
    th3 = cv2.threshold(blur,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)[1]
    contours, hierarchy = cv2.findContours(th3, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(im, contours, 1, (0,255,0), 3)
    print("Before saving image:")  
    print(os.listdir(directory))  

    cv2.imwrite("img_contour_out.jpg", im)