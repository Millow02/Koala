import os
import cv2
import numpy as np
from alpr.utils import log, add_bp, test_manager
from alpr.upscaler import Upscaler

class Rectification:
    """
    A class to perform image rectification using super-resolution, various image processing 
    techniques, and homography transformation. It is typically used for tasks like 
    rectifying license plate images.
    """
    def __init__(self, 
                 upscaler, 
                 test_manager, 
                 output_size=(794, 400), 
                 power_level=3):
        """
        Initialize the Rectification object with model configuration and processing parameters.
        
        Args:
            sr_model_path (str): Path to the super-resolution model file.
            test_manager (callable): A function to handle intermediate test outputs.
            output_size (tuple): Desired output image size as (width, height) for the rectified image.
            cropped_dir (list[str], optional): List of directories containing cropped images.
            output_dir (str, optional): Directory to store the rectified images.
            power_level (int, optional): Determines the threshold level for generating grayscale images.
        """
        self.output_size = output_size
        self.sr = upscaler.get_sr() 
        self.input_height = 640
        self.input_weight = 640
        self.contour_detection_area = 0.8  # Cannot be less than 0.5
        self.segmentation_width, self.segmentation_height = output_size
        self.thresholds_levels = [
            [70, 80, 90, 100, 110, 130, 150],
            [60, 70, 80, 90, 100, 110, 130, 150, 170],
            [50, 60, 70, 80, 90, 100, 110, 130, 150, 170, 190],
            [20, 50, 60, 70, 80, 90, 100, 110, 130, 150, 170, 190, 210]
        ]
        self.test_manager = test_manager
        self.power_level = power_level

    def set_directories(self, cropped_dir, output_dir):
        self.cropped_dir = cropped_dir
        self.output_dir = output_dir
        if self.cropped_dir and self.output_dir:
            log("RECTIFICATION", f"Input directories: {self.cropped_dir} | Output directory: {self.output_dir}")

    def preprocess_image(self, image):
        """
        Upsample and resize the input image to standard dimensions for further processing.
        
        Args:
            image (np.array): Input image in BGR format.
        
        Returns:
            np.array: Preprocessed image.
        """
        # Upsample the image using the super-resolution model.
        upsampled_image = self.sr.upsample(image)
        log("RECTIFICATION", "Preprocessing completed.")
        return cv2.resize(upsampled_image, (self.input_height, self.input_weight))

    def process_gray_images(self, filtered_image, power_level=None):
        """
        Generate multiple binary thresholded images from a grayscale image for contour detection.
        
        Args:
            filtered_image (np.array): Grayscale image after filtering.
            power_level (int, optional): Overrides the default power level for thresholding.
                                         If None, uses the instance's power_level.
        
        Returns:
            list: List of thresholded binary images.
        """
        if power_level is None:
            power_level = self.power_level
        
        processed_images = []
        log("RECTIFICATION", "Thresholding grayscale images for contour detection.")

        # Apply a series of thresholds based on the power level configuration.
        for thresh in self.thresholds_levels[power_level]:
            _, thresh_img = cv2.threshold(filtered_image, thresh, 255, cv2.THRESH_BINARY)
            processed_images.append(thresh_img)

        log("RECTIFICATION", f"Generated {len(self.thresholds_levels[power_level])} binary images.")
        return processed_images

    def apply_vignette(self, image, kernel_scale=200):
        """
        Apply a vignette effect to the image by darkening its edges.
        
        Args:
            image (np.array): Input image in BGR format.
            kernel_scale (float): Standard deviation for the Gaussian kernel controlling vignette strength.
        
        Returns:
            np.array: Image with the vignette effect applied.
        """
        rows, cols = image.shape[:2]
        kernel_x = cv2.getGaussianKernel(cols, kernel_scale)
        kernel_y = cv2.getGaussianKernel(rows, kernel_scale)
        kernel = kernel_y * kernel_x.T
        mask = kernel / kernel.max()  # Normalize mask to range [0, 1]

        # Apply the mask to each channel.
        vignette = np.empty_like(image, dtype=np.float32)
        for i in range(3):  # For B, G, R channels.
            vignette[:, :, i] = image[:, :, i] * mask

        # Clip values and convert to uint8.
        vignette = np.clip(vignette, 0, 255).astype(np.uint8)
        return vignette

    def darken_gray_pixels(self, bgr_image, threshold=15):
        """
        Darken pixels that are nearly gray by setting them to black.
        
        A pixel is considered nearly gray if the difference between its maximum and 
        minimum channel values is less than the threshold.
        
        Args:
            bgr_image (np.array): Input image in BGR format.
            threshold (int): Threshold for determining near-gray pixels.
        
        Returns:
            np.array: Image with near-gray pixels darkened.
        """
        bgr_image = np.asarray(bgr_image)
        # Calculate the range for each pixel across B, G, R channels.
        pixel_range = np.ptp(bgr_image, axis=2)
        # Create a mask where the pixel range is below the threshold.
        gray_mask = pixel_range < threshold
        # Set near-gray pixels to black.
        bgr_image[gray_mask] = [0, 0, 0]
        return bgr_image

    def generate_contour_elements(self, img):
        """
        Generate a collection of processed image elements to aid in contour detection.
        
        This method applies several preprocessing techniques such as gray conversion, 
        bilateral filtering, vignette effect, gamma correction, CLAHE, Gaussian blur, 
        and Laplacian filtering.
        
        Args:
            img (np.array): Input image in BGR format.
        
        Returns:
            tuple: (RGB image, list of processed images for contour detection)
        """
        log("RECTIFICATION", "Generating contour elements.")
        rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Remove nearly gray pixels.
        processed_image = self.darken_gray_pixels(img, threshold=15)
        gray_removed = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
        log("RECTIFICATION", "Nearly gray areas darkened and removed.")

        # Apply vignette effect.
        vignette = self.apply_vignette(img)
        gray_vignette = cv2.cvtColor(vignette, cv2.COLOR_BGR2GRAY)
        log("RECTIFICATION", "Vignette effect generated.")

        # Standard grayscale and filtering.
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        filtered = cv2.bilateralFilter(gray, 9, 78, 40)
        filtered_vignette = cv2.bilateralFilter(gray, 9, 78, 40)
        edged = cv2.Canny(gray, 100, 180)
        log("RECTIFICATION", "Generated blurred, edge, and vignette images.")

        # Additional thresholding for contour detection.
        processed_grays = self.process_gray_images(filtered)
        processed_grays_v = self.process_gray_images(filtered_vignette)

        # Gamma correction.
        invGamma = 0.5
        table = np.array([((i / 255.0) ** invGamma) * 255 for i in range(256)]).astype("uint8")
        gamma_corrected = cv2.LUT(rgb_image, table)
        log("RECTIFICATION", "Gamma correction applied.")

        # Enhance contrast using CLAHE.
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray_enhanced = clahe.apply(gray)
        log("RECTIFICATION", "CLAHE contrast enhancement applied.")

        # Gaussian blur and Laplacian edge detection.
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        laplacian = cv2.Laplacian(blurred, cv2.CV_64F)
        abs_laplacian = cv2.convertScaleAbs(laplacian)
        log("RECTIFICATION", "Laplacian computed.")

        # Compile all elements.
        contour_elements = [
            gray,
            gray_enhanced,
            gray_vignette,
            gray_removed,
            filtered,
            filtered_vignette,
            abs_laplacian,
            edged
        ]
        contour_elements.extend(processed_grays)
        contour_elements.extend(processed_grays_v)
         
        return rgb_image, contour_elements

    def plot_contour(self, image_input, contours_output):
        """
        Draw the detected contour on the image and add it to the output list.
        
        Args:
            image_input (np.array): Input image for contour detection.
            contours_output (list): List to append the detected contour.
        """
        log("RECTIFICATION", "Plotting detected contour.")
        number_plate_contour = self.detect_contours(image_input)
        if number_plate_contour is not None:
            cv2.drawContours(image_input, [number_plate_contour], -1, (0, 255, 0), 3)
            contours_output.append(number_plate_contour)
            log("RECTIFICATION", "Contour with 4 corners plotted.")
        else:
            log("RECTIFICATION", "Did not detect contour.")

    def order_points(self, pts):
        """
        Order the points in the following order: top-left, top-right, bottom-right, bottom-left.
        
        Args:
            pts (np.array): Array of points.
        
        Returns:
            np.array: Ordered array of points.
        """
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        log("RECTIFICATION", "Contour points ordered.")
        return rect

    def restructure_array(self, arr):
        """
        Restructure the array of points to the required format for rectifiction.
        
        Args:
            arr (list): List of points from contour detection.
        
        Returns:
            list: Reformatted list of points.
        """
        return [point[0].tolist() for point in arr]

    def straighten_image(self, src_pts, image):
        """
        Apply a homography transform to rectify the image based on the detected contour.
        
        Args:
            src_pts (list): Source contour points.
            image (np.array): Input image in BGR format.
        
        Returns:
            np.array: Rectified image.
        """
        log("RECTIFICATION", "Straightening image using homography transform.")
        src_pts = np.float32(self.restructure_array(src_pts))
        ordered_src_pts = self.order_points(src_pts)
        log("RECTIFICATION", f"Source points for homography: {ordered_src_pts}")

        # Define destination points for the rectified image.
        dst_pts = np.float32([
            [0, 0],  # Top-left
            [self.segmentation_width, 0],  # Top-right
            [self.segmentation_width, self.segmentation_height],  # Bottom-right
            [0, self.segmentation_height]  # Bottom-left
        ])
        
        H, _ = cv2.findHomography(ordered_src_pts, dst_pts)
        warped_image = cv2.warpPerspective(image, H, (self.segmentation_width, self.segmentation_height))
        log("RECTIFICATION", "Homography transform applied.")
        return warped_image

    def rectify_image(self, image):
        """
        Process a single image to detect contours and rectify it.
        
        Args:
            image (np.array): Input image in BGR format.
        
        Returns:
            np.array: Rectified image if successful; otherwise, None.
        """
        rectified_image = None
        try:
            # Dummy filename used for saving output.
            dummy_filename = "image"
            preprocessed = self.preprocess_image(image)
            processed_rgb, contour_elements = self.generate_contour_elements(preprocessed)


            detected_contours = []
            # Loop through each processed element to plot contours.
            for element in contour_elements:
                self.plot_contour(element, detected_contours)

            if detected_contours:
                for cnt in detected_contours:
                    rectified_image = self.straighten_image(cnt, processed_rgb)
                    output_path = os.path.join(self.output_dir, f'{os.path.splitext(dummy_filename)[0]}_rectified.jpg')
                    cv2.imwrite(output_path, rectified_image)
                    log("RECTIFICATION", f"Rectified image saved at {output_path}.")
            else:
                log("RECTIFICATION", "No valid contours detected for rectification.")

        except Exception as e:
            log("RECTIFICATION", f"Error during rectification: {e}")
        return rectified_image

    def rectify(self):
        """
        Process all images in the cropped directories and rectify them.
        
        Returns:
            int: The number of successfully rectified images.
        """
        successful_rectifications = 0
        if not self.cropped_dir or not self.output_dir:
            log("RECTIFICATION", "Cropped or output directory not set.")
            return successful_rectifications

        for directory in self.cropped_dir:
            idx = 0
            for image_file in os.listdir(directory):
                log("RECTIFICATION", f"Attempting to rectify {image_file}.")
                crop_filename = os.path.join(directory, image_file)
                image = cv2.imread(crop_filename)
                log("RECTIFICATION", "Image loaded successfully.")
                rectified = self.rectify_image(image)
                if rectified is not None:
                    rectified_filename = os.path.join(
                        self.output_dir, f"{os.path.splitext(image_file)[0]}_rectified_{idx+1}.jpg"
                    )
                    cv2.imwrite(rectified_filename, rectified)
                    successful_rectifications += 1
                    log("RECTIFICATION", f"{image_file} rectified successfully.")
                else:
                    log("RECTIFICATION", f"{image_file} rectification unsuccessful.")
                idx += 1
        log("RECTIFICATION", f"Total rectified images: {successful_rectifications}")
        return successful_rectifications

    def detect_contours(self, processed_img):
        """
        Find and return the best contour that likely represents a number plate.
        
        Args:
            processed_img (np.array): Image used for contour detection.
        
        Returns:
            np.array or None: Contour with four corners if detected; otherwise, None.
        """
        log("RECTIFICATION", "Finding contour points.")
        cnts = cv2.findContours(processed_img.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)[0]
        # Sort contours by area (largest first) and consider the top 30.
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:30]

        total_area = self.input_height * self.input_weight
        lower_bound = total_area * (1 - self.contour_detection_area)
        upper_bound = total_area * self.contour_detection_area

        log("RECTIFICATION", "Contour detection parameters configured.")

        number_plate_contour = None
        for c in cnts:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            # Check for a 4-corner contour within the desired area bounds.
            if len(approx) == 4 and lower_bound < cv2.contourArea(c) < upper_bound:
                number_plate_contour = approx
                log("RECTIFICATION", "Detected contour with 4 corners.")
                break
        return number_plate_contour
