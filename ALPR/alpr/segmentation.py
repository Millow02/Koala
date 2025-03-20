import os
import cv2
from ultralytics import YOLO
from alpr.utils import log


class Segmentation:
    def __init__(
        self,
        model_path,
        upscaler,
        padding_levels=[0],
        input_height=480,
        input_width=640,
    ):
        self.model = YOLO(model_path)
        self.padding_levels = padding_levels
        self.upscaler = upscaler
        self.input_height = input_height
        self.input_width = input_width
        self.idx = 0

    def set_directories(self, cropped_dir, rectified_dir, output_dir):
        self.cropped_directories = cropped_dir
        self.rectified_dir = rectified_dir
        self.output_dir = output_dir
        if self.cropped_directories and self.output_dir and self.rectified_dir:
            log(
                "SEGMENTATION",
                f"Input directories: {self.cropped_directories} & {self.rectified_dir} | Output directory: {self.output_dir} ",
            )

    def upscale_input(self, image_path):
        image = cv2.imread(image_path)
        if image is None:
            log("SEGMENTATION", f"Failed to read image from {image_path}.")
            return None
        upscaled_image = self.upscaler.upscale_image(
            image, (self.input_width, self.input_height)
        )
        cv2.imwrite(image_path, upscaled_image)
        log("SEGMENTATION", "Upscaled input.")
        return upscaled_image

    def segment_characters(self, image_path, output_dir, zoom, UPSCALE=True):
        os.makedirs(output_dir, exist_ok=True)
        # Upscale and retrieve the image
        if UPSCALE:
            image = self.upscale_input(image_path)
        else: 
            image = cv2.imread(image_path)

        if image is None:
            return 0

        results = self.model.predict(source=image_path)
        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            # labels = result.boxes.cls.cpu().numpy()  # if needed
            for idx, box in enumerate(boxes):
                x1, y1, x2, y2 = map(int, box)
                crop = image[
                    max(y1 - zoom, 0) : min(y2 + zoom, image.shape[0]),
                    max(x1 - zoom, 0) : min(x2 + zoom, image.shape[1]),
                ]
                seg_filename = os.path.join(output_dir, f"segment_{idx + 1}.jpg")
                cv2.imwrite(seg_filename, crop)
            log("SEGMENTATION", f"Saved characters to {output_dir}.")

        license_plate = self.get_license_plate(results)

        return len(license_plate)

    def get_license_plate(self, results):
        boxes = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]
                boxes.append((x1, class_name))

        # Sort boxes by x-coordinate and concatenate class names to form the license plate string
        boxes.sort(key=lambda b: b[0])
        license_plate = "".join([b[1] for b in boxes])
        log("SEGMENTATION", f"License Plate detected {license_plate}.")

        self.license_plate_result = license_plate

        return license_plate

    def process_cropped_images(self):
        for directory in self.cropped_directories:
            image_files = os.listdir(directory)
            if not image_files:
                log("SEGMENTATION", f"No images found in {directory}.")
                continue
            # Assuming each directory contains one image
            image_file = image_files[0]
            crop_filename = os.path.join(directory, image_file)
            log("SEGMENTATION", f"Segmenting {crop_filename} (Index: {self.idx}).")

            for zoom in self.padding_levels:
                dir_idx = os.path.join(self.output_dir, f"{self.idx}")
                output_seg_dir = os.path.join(dir_idx, f"{zoom}")
                os.makedirs(output_seg_dir, exist_ok=True)
                n_char_segmented = self.segment_characters(
                    crop_filename, output_seg_dir, zoom
                )
                log(
                    "SEGMENTATION",
                    f"Zoom Level: {zoom} | Segmented {n_char_segmented} characters from license plate and stored in {output_seg_dir}.",
                )
            self.idx += 1

    def process_rectified_inputs(self):
        for image_file in os.listdir(self.rectified_dir):
            crop_filename = os.path.join(self.rectified_dir, image_file)
            log("SEGMENTATION", f"Segmenting {crop_filename} (Index: {self.idx}).")

            for zoom in self.padding_levels:
                dir_idx = os.path.join(self.output_dir, f"{self.idx}")
                output_seg_dir = os.path.join(dir_idx, f"{zoom}")
                os.makedirs(output_seg_dir, exist_ok=True)
                n_char_segmented = self.segment_characters(
                    crop_filename, output_seg_dir, zoom
                )
                log(
                    "SEGMENTATION",
                    f"Zoom Level: {zoom} | Segmented {n_char_segmented} characters from license plate and stored in {output_seg_dir}.",
                )
            self.idx += 1

    def segment(self):
        self.process_cropped_images()
        self.process_rectified_inputs()
        log("SEGMENTATION", f"Number of total images segmented: {self.idx}.")

        return self.license_plate_result
