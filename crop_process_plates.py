from ultralytics import YOLO
import cv2
import os


# Use the absolute path to the image file
input_dir = 'C:/Users/niraj/OneDrive/Desktop/Koala/Data'
output_dir = 'C:/Users/niraj/OneDrive/Desktop/Koala/Cropped_And_Processed'

os.makedirs(input_dir,exist_ok=True)

model = YOLO('C:/Users/niraj/OneDrive/Desktop/Koala/runs/detect/train13/weights/best.pt')  # load a custom model

threshold = 0.5

for filename in os.listdir(input_dir):
    if filename.endswith('jpg') or filename.endswith('png'):
        image_path = os.path.join(input_dir, filename)
        output_image_path = os.path.join(output_dir, '{}_out.jpg.'.format(os.path.splitext(filename)[0]))

        print(f"Processing image: {image_path}")

        image = cv2.imread(image_path)
        if image is None:
            print("Error: Could not read image.")
            continue
 
        results = model(image)[0]

        for result in results.boxes.data.tolist():
            x1,y1,x2,y2,score,class_id = result

            if score > threshold:
                cv2.rectangle(image,(int(x1),int(y1)),(int(x2),int(y2)),(0,255,0),4)
                cv2.putText(image, results.names[int(class_id)].upper(), (int(x1),int(y1-10)),
                            cv2.FONT_HERSHEY_COMPLEX, 1.3, (0,255,0),3, cv2.LINE_AA)
                
                cropped_plate = image[int(y1):int(y2),int(x1):int(x2)]
                zoom_factor = 5
                cropped_plate_zoomed = cv2.resize(cropped_plate,None, fx=zoom_factor,fy = zoom_factor, interpolation= cv2.INTER_LINEAR)
                cropped_plate_zoomed = cv2.cvtColor(cropped_plate_zoomed,cv2.COLOR_BGR2GRAY)

                cropped_plate_zoomed = cv2.GaussianBlur(cropped_plate_zoomed,(3,3),0)
                cropped_plate_zoomed = cv2.threshold(cropped_plate_zoomed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

                cropped_plate_path = os.path.join(output_dir,'{}_out_cropped_with_guassianblur.jpg'.format(os.path.splitext(filename)[0]))
                cv2.imwrite(cropped_plate_path, cropped_plate_zoomed)
                print(f"Cropped and zoomed license plate saved to:{cropped_plate_path}")

            cv2.imwrite(output_image_path, image)
            print(f"Output image saved to: {output_image_path}")
        
cv2.destroyAllWindows()
