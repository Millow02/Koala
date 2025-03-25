import os
import cv2
import numpy as np
from alpr.utils import log, add_bp, test_manager
from alpr.upscaler import Upscaler

###############################################################################
# Configuration class: Modify these flags/parameters as needed.
###############################################################################
class RectificationConfig:
    def __init__(self):
        # General dimensions
        self.output_size = (794, 400)
        self.input_height = 640
        self.input_width = 640
        # For homography (rectification) purposes
        self.segmentation_width, self.segmentation_height = self.output_size
        
        # Contour detection
        self.contour_detection_area = 0.8  # Fractional area thresholds
        self.thresholds_levels = [
            [70, 80, 90, 100, 110, 130, 150],
            [60, 70, 80, 90, 100, 110, 130, 150, 170],
            [50, 60, 70, 80, 90, 100, 110, 130, 150, 170, 190],
            [20, 50, 60, 70, 80, 90, 100, 110, 130, 150, 170, 190, 210]
        ]
        
        # Flags for enabling/disabling processing steps
        self.enable_blurred_image=False
        self.enable_vignette_filt=False
        self.enable_edging=False
        self.enable_vignette = False
        self.enable_gamma = False
        self.enable_clahe = False
        self.enable_laplacian = False
        
        # Parameters for various image processing steps
        self.vignette_kernel_scale = 200
        self.gamma_inv = 0.5  # Inverse gamma value for correction
        self.clahe_clip_limit = 2.0
        self.clahe_tile_grid_size = (8, 8)
        self.bilateral_filter_params = (9, 78, 40)  # (diameter, sigmaColor, sigmaSpace)
        self.canny_thresholds = (100, 180)
        self.gaussian_blur_kernel = (3, 3)
        self.approx_poly_dp_epsilon_ratio = 0.02  # For contour approximation

###############################################################################
# Rectification class using the configuration settings above.
###############################################################################
class Rectification:
    """
    A class to perform image rectification using super-resolution, various image 
    processing techniques, and homography transformation. It is typically used for 
    tasks like rectifying license plate images.
    """
    def __init__(self, upscaler, test_manager, config: RectificationConfig, power_level=1):
        """
        Initialize the Rectification object with the provided upscaler, test manager, 
        and configuration settings.
        
        Args:
            upscaler (Upscaler): An instance that provides the super-resolution model.
            test_manager (callable): A function to handle intermediate test outputs.
            config (RectificationConfig): Configuration parameters and flags.
            power_level (int, optional): Index to choose threshold levels from configuration.
        """
        self.config = config
        self.sr = upscaler.get_sr() 
        self.test_manager = test_manager
        self.power_level = power_level
        # Directories will be set later.
        self.cropped_dir = None
        self.output_dir = None

    def set_directories(self, cropped_dir, output_dir):
        self.cropped_dir = cropped_dir
        self.output_dir = output_dir
        if self.cropped_dir and self.output_dir:
            log("RECTIFICATION", f"Input directories: {self.cropped_dir} | Output directory: {self.output_dir}")

    def preprocess_image(self, image):
        """
        Upsample and resize the input image to standard dimensions for further processing.
        """
        # Upsample the image using the super-resolution model.
        upsampled_image = self.sr.upsample(image)
        log("RECTIFICATION", "Preprocessing completed.")
        return cv2.resize(upsampled_image, (self.config.input_height, self.config.input_width))

    def process_gray_images(self, filtered_image, power_level=None):
        """
        Generate multiple binary thresholded images from a grayscale image for contour detection.
        """
        if power_level is None:
            power_level = self.power_level
        
        processed_images = []
        log("RECTIFICATION", "Thresholding grayscale images for contour detection.")

        # Apply a series of thresholds based on the power level configuration.
        for thresh in self.config.thresholds_levels[power_level]:
            _, thresh_img = cv2.threshold(filtered_image, thresh, 255, cv2.THRESH_BINARY)
            processed_images.append(thresh_img)

        log("RECTIFICATION", f"Generated {len(self.config.thresholds_levels[power_level])} binary images.")
        return processed_images

    def apply_vignette(self, image, kernel_scale=None):
        """
        Apply a vignette effect to the image by darkening its edges.
        """
        if kernel_scale is None:
            kernel_scale = self.config.vignette_kernel_scale
            
        rows, cols = image.shape[:2]
        kernel_x = cv2.getGaussianKernel(cols, kernel_scale)
        kernel_y = cv2.getGaussianKernel(rows, kernel_scale)
        kernel = kernel_y * kernel_x.T
        mask = kernel / kernel.max()  # Normalize mask to range [0, 1]

        # Apply the mask to each channel.
        vignette = np.empty_like(image, dtype=np.float32)
        for i in range(3):  # For B, G, R channels.
            vignette[:, :, i] = image[:, :, i] * mask

        vignette = np.clip(vignette, 0, 255).astype(np.uint8)
        return vignette

    def darken_gray_pixels(self, bgr_image, threshold=15):
        """
        Darken pixels that are nearly gray by setting them to black.
        """
        bgr_image = np.asarray(bgr_image)
        pixel_range = np.ptp(bgr_image, axis=2)
        gray_mask = pixel_range < threshold
        bgr_image[gray_mask] = [0, 0, 0]
        return bgr_image

    def generate_contour_elements(self, img):
        """
        Generate a collection of processed image elements to aid in contour detection.
        
        Several preprocessing techniques are applied conditionally based on configuration flags.
        """
        if img is None or not isinstance(img, np.ndarray):
            log("RECTIFICATION", "Invalid input image provided; returning empty results.")
            return None, []
        
        log("RECTIFICATION", "Generating contour elements.")
        rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Standard grayscale and filtering.
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Remove nearly gray pixels.
        processed_image = self.darken_gray_pixels(img, threshold=15)
        try:
            gray_removed = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
            log("RECTIFICATION", "Nearly gray areas darkened and removed.")
        except Exception as e:
            log("RECTIFICATION", f"Gray conversion failed: {e}. Using original grayscale image.")
            gray_removed = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply vignette effect if enabled.
        if self.config.enable_vignette and img.shape[0] > 100 and img.shape[1] > 100:
            vignette = self.apply_vignette(img)
            gray_vignette = cv2.cvtColor(vignette, cv2.COLOR_BGR2GRAY)
            log("RECTIFICATION", "Vignette effect generated.")
        else:
            gray_vignette = None
            log("RECTIFICATION", "Vignette effect skipped.")


        if self.config.enable_blurred_image:
            filtered = cv2.bilateralFilter(gray, *self.config.bilateral_filter_params)
            processed_grays = self.process_gray_images(filtered)
            log("RECTIFICATION", "Generated blurred images.")

        if self.config.enable_vignette_filt:
            filtered_vignette = cv2.bilateralFilter(gray, *self.config.bilateral_filter_params)
            processed_grays_v = self.process_gray_images(filtered_vignette)
            log("RECTIFICATION", "Generated vignette filtered images.")

        if self.config.enable_edging:
            edged = cv2.Canny(gray, *self.config.canny_thresholds)
            log("RECTIFICATION", "Generated edged images.")

        # Additional thresholding for contour detection.

        # Gamma correction.
        if self.config.enable_gamma:
            invGamma = self.config.gamma_inv
            table = np.array([((i / 255.0) ** invGamma) * 255 for i in range(256)]).astype("uint8")
            gamma_corrected = cv2.LUT(rgb_image, table)
            log("RECTIFICATION", "Gamma correction applied.")
        else:
            gamma_corrected = rgb_image
            log("RECTIFICATION", "Gamma correction skipped.")

        # Enhance contrast using CLAHE.
        if self.config.enable_clahe:
            clahe = cv2.createCLAHE(clipLimit=self.config.clahe_clip_limit, tileGridSize=self.config.clahe_tile_grid_size)
            gray_enhanced = clahe.apply(gray)
            log("RECTIFICATION", "CLAHE contrast enhancement applied.")
        else:
            gray_enhanced = gray
            log("RECTIFICATION", "CLAHE enhancement skipped.")

        # Gaussian blur and Laplacian edge detection.
        if self.config.enable_laplacian:
            blurred = cv2.GaussianBlur(gray, self.config.gaussian_blur_kernel, 0)
            laplacian = cv2.Laplacian(blurred, cv2.CV_64F)
            abs_laplacian = cv2.convertScaleAbs(laplacian)
            log("RECTIFICATION", "Laplacian computed.")
        else:
            abs_laplacian = None
            log("RECTIFICATION", "Laplacian skipped.")

        # Compile all elements.
        contour_elements = []
        if gray is not None:
            contour_elements.append(gray)
        if gray_enhanced is not None:
            contour_elements.append(gray_enhanced)
        if processed_grays:
            contour_elements.extend(processed_grays)
        if processed_grays_v:
            contour_elements.extend(processed_grays_v)
        if gray_vignette is not None:
            contour_elements.append(gray_vignette)
        if abs_laplacian is not None:
            contour_elements.append(abs_laplacian)

        return rgb_image, contour_elements

    def plot_contour(self, image_input, contours_output):
        """
        Draw the detected contour on the image and add it to the output list.
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
        Restructure the array of points to the required format for rectification.
        """
        return [point[0].tolist() for point in arr]

    def straighten_image(self, src_pts, image):
        """
        Apply a homography transform to rectify the image based on the detected contour.
        """
        log("RECTIFICATION", "Straightening image using homography transform.")
        src_pts = np.float32(self.restructure_array(src_pts))
        ordered_src_pts = self.order_points(src_pts)
        log("RECTIFICATION", f"Source points for homography: {ordered_src_pts}")

        dst_pts = np.float32([
            [0, 0],  # Top-left
            [self.config.segmentation_width, 0],  # Top-right
            [self.config.segmentation_width, self.config.segmentation_height],  # Bottom-right
            [0, self.config.segmentation_height]  # Bottom-left
        ])
        
        H, _ = cv2.findHomography(ordered_src_pts, dst_pts)
        warped_image = cv2.warpPerspective(image, H, (self.config.segmentation_width, self.config.segmentation_height))
        log("RECTIFICATION", "Homography transform applied.")
        return warped_image

    def rectify_image(self, image, file_name, warp=False):
        """
        Process a single image to detect contours and rectify it.
        """
        rectified_image = None
        try:
            dummy_filename = file_name
            preprocessed = self.preprocess_image(image)
            processed_rgb, contour_elements = self.generate_contour_elements(preprocessed)

            if warp:
                detected_contours = []
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

            for i, element in enumerate(contour_elements):
                output_path = os.path.join(self.output_dir, f'{dummy_filename}_rectified_{i}.jpg')
                cv2.imwrite(output_path, element)
                log("RECTIFICATION", f"Rectified image saved at {output_path}.")

        except Exception as e:
            log("RECTIFICATION", f"Error during rectification: {e}")
        return rectified_image

    def rectify(self):
        """
        Process all images in the cropped directories and rectify them.
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
                rectified = self.rectify_image(image, image_file)
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
        """
        log("RECTIFICATION", "Finding contour points.")
        cnts = cv2.findContours(processed_img.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)[0]

        # Sort contours by area (largest first) and consider the top 30.
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:30]

        total_area = self.config.input_height * self.config.input_width
        lower_bound = total_area * (1 - self.config.contour_detection_area)
        upper_bound = total_area * self.config.contour_detection_area

        log("RECTIFICATION", "Contour detection parameters configured.")

        number_plate_contour = None
        for c in cnts:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, self.config.approx_poly_dp_epsilon_ratio * peri, True)
            if len(approx) == 4 and lower_bound < cv2.contourArea(c) < upper_bound:
                number_plate_contour = approx
                log("RECTIFICATION", "Detected contour with 4 corners.")
                break
        return number_plate_contour
