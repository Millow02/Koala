import cv2
import numpy as np

class Rectification:
    def __init__(self, sr_model_path, output_size=(794, 400)):
        self.output_size = output_size
        self.sr = cv2.dnn_superres.DnnSuperResImpl_create()
        self.sr.readModel(sr_model_path)
        self.sr.setModel("lapsrn", 2)

    def set_directories(cropped_dir, output_dir):
        self.cropped_dir = cropped_dir        
        self.output_dir = output_dir

    def preprocess(self, image):
        # Upsample and resize to a standard dimension for processing.
        image = self.sr.upsample(image)
        return cv2.resize(image, (640, 640))

    def generate_contour(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edged = cv2.Canny(gray, 100, 180)
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        for cnt in contours:
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
            if len(approx) == 4:
                return approx
        return None

    def order_points(self, pts):
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        return rect

    def rectify_image(self, image):
        preprocessed = self.preprocess(image)
        contour = self.generate_contour(preprocessed)
        if contour is None:
            return None
        pts = self.order_points(contour.reshape(4, 2))
        dst = np.float32([[0, 0],
                          [self.output_size[0], 0],
                          [self.output_size[0], self.output_size[1]],
                          [0, self.output_size[1]]])
        H, _ = cv2.findHomography(np.float32(pts), dst)
        return cv2.warpPerspective(preprocessed, H, self.output_size)

    def rectify(self): 
        for directory in cropped_dir: 
            crop_filename = os.path.join(cropped_dir, directory, image)
            image = cv2.imread(crop_filename)
            rectified = rectifier.rectify(image)
            if rectified is not None:
                rectified_filename = os.path.join(rectified_dir, f"rectified_{idx+1}.jpg")
                cv2.imwrite(rectified_filename, rectified)
    # (The rectification, segmentation, and OCR parts remain commented for now.)
    #     for image in os.listdir(directory): 
    #         crop_filename = os.path.join(cropped_dir, directory, image)
    #         image = cv2.imread(crop_filename)
    #         rectified = rectifier.rectify(image)
    #         if rectified is not None:
    #             rectified_filename = os.path.join(rectified_dir, f"rectified_{idx+1}.jpg")
    #             cv2.imwrite(rectified_filename, rectified)
