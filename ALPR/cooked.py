import os
import time
import logging
import subprocess
import psutil
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from queue import Queue
import gc
from PIL import Image
import sys

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create a separate script for license plate extraction
EXTRACTION_SCRIPT = """
import sys
import os
import base64
from llama_cpp import Llama
from llama_cpp.llama_chat_format import MiniCPMv26ChatHandler
from PIL import Image
import gc
import io
import uuid
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Supabase configuration - replace with your actual values
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Initialize Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error initializing Supabase client: {str(e)}", file=sys.stderr)
    supabase = None

def upload_to_supabase(image_path, bucket_name="pictures"):
    if supabase is None:
        print("Supabase client not initialized", file=sys.stderr)
        return None
        
    try:
        # Generate a unique file name
        file_name = f"{uuid.uuid4()}{os.path.splitext(image_path)[1]}"

        # Read the file
        with open(image_path, "rb") as f:
            file_data = f.read()

        # Upload to Supabase
        response = supabase.storage.from_(bucket_name).upload(
            file_name, file_data, {"content-type": "image/jpeg"}
        )

        # Get the public URL
        file_url = supabase.storage.from_(bucket_name).get_public_url(file_name)

        print(f"Image uploaded to Supabase: {file_url}")
        return file_url

    except Exception as e:
        print(f"Error uploading to Supabase: {str(e)}", file=sys.stderr)
        return None


def save_to_database(license_plate, image_url, camera_id=1):
    if supabase is None:
        print("Supabase client not initialized", file=sys.stderr)
        return False
        
    try:
        # Insert into the OccupancyEvent table
        data = {
            "license_plate": license_plate,
            "status": "Unprocessed",
            "cameraId": camera_id,
            "image": image_url,
        }

        response = supabase.table("OccupancyEvent").insert(data).execute()
        print(f"Data saved to database: {license_plate}")
        print(f"Response from supabase: {response}")
        return True

    except Exception as e:
        print(f"Error saving to database: {str(e)}", file=sys.stderr)
        return False

def resize_image(image_path, max_size=1000):
    try:
        # Open the image
        with Image.open(image_path) as img:
            # Calculate new dimensions while maintaining aspect ratio
            width, height = img.size
            if width > max_size or height > max_size:
                if width > height:
                    new_width = max_size
                    new_height = int(height * (max_size / width))
                else:
                    new_height = max_size
                    new_width = int(width * (max_size / height))
                
                # Resize the image
                img = img.resize((new_width, new_height), Image.LANCZOS)
                
                # Save to byte array
                img_byte_arr = io.BytesIO()
                img_format = image_path.split('.')[-1].upper()
                if img_format == 'JPG':
                    img_format = 'JPEG'
                img.save(img_byte_arr, format=img_format, quality=85)
                img_byte_arr.seek(0)
                
                # Return base64 encoded image
                base64_data = base64.b64encode(img_byte_arr.read()).decode('utf-8')
                return f"data:image/{img_format.lower()};base64,{base64_data}"
        
        # If no resizing needed, return original image as base64
        with open(image_path, "rb") as img_file:
            base64_data = base64.b64encode(img_file.read()).decode("utf-8")
            return f"data:image/png;base64,{base64_data}"
    except Exception as e:
        print(f"Error resizing image: {str(e)}", file=sys.stderr)
        # Fall back to original image
        with open(image_path, "rb") as img_file:
            base64_data = base64.b64encode(img_file.read()).decode("utf-8")
            return f"data:image/png;base64,{base64_data}"

def extract_license_plate(image_path):
    try:
        # Initialize chat handler and model with explicit memory management options
        chat_handler = MiniCPMv26ChatHandler(clip_model_path="./mmproj-model-f16.gguf")
        
        llm = Llama(
            model_path="./Model-7.6B-Q4_K_M.gguf",
            chat_handler=chat_handler,
            verbose=False,
            n_ctx=1024,  # Reduced context window to save memory
            n_batch=512,  # Reduced batch size
            n_gpu_layers=-1  # Use CPU only if memory is a concern
        )
        
        # Set up prompts
        system_prompt = "You are a specialized license plate recognition assistant."
        user_prompt = "Extract the license plate number from this vehicle image. Return ONLY the license plate number, no explanations."
        
        # Resize and convert image to data URI
        data_uri = resize_image(image_path)
        
        # Create messages for the model
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            },
        ]
        
        # Get the response from the model
        response = llm.create_chat_completion(
            messages=messages, 
            temperature=0.1, 
            stream=False
        )
        
        # Extract license plate from response
        license_plate = response["choices"][0]["message"]["content"].strip()
        
        # Clean up the model resources
        llm.close()
        del llm
        del chat_handler
        gc.collect()
        
        return license_plate
    except Exception as e:
        print(f"Extraction error: {str(e)}", file=sys.stderr)
        return f"ERROR: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extract_script.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Extract license plate
    license_plate = extract_license_plate(image_path)
    
    # Only proceed with upload and database entry if extraction was successful
    if not license_plate.startswith("ERROR:"):
        # Upload image to Supabase
        image_url = upload_to_supabase(image_path)
        
        if image_url:
            # Save data to database
            success = save_to_database(license_plate, image_url)
            if success:
                print(f"{license_plate}|{image_url}")
            else:
                print(license_plate)
        else:
            # Just print the license plate if upload failed
            print(license_plate)
    else:
        # Print the error
        print(license_plate)
    
    sys.exit(0)
"""
class MemoryMonitor:
    def __init__(self, threshold_percent=80):
        self.threshold_percent = threshold_percent
        self._stop_event = threading.Event()
        self.monitor_thread = threading.Thread(target=self._monitor_memory)
        self.monitor_thread.daemon = True
    
    def start(self):
        self.monitor_thread.start()
        
    def stop(self):
        self._stop_event.set()
        self.monitor_thread.join(timeout=2)
    
    def _monitor_memory(self):
        while not self._stop_event.is_set():
            try:
                memory_usage = psutil.virtual_memory().percent
                if memory_usage > self.threshold_percent:
                    logger.warning(f"Memory usage high: {memory_usage}%. Forcing garbage collection.")
                    gc.collect()
            except Exception as e:
                logger.error(f"Error in memory monitor: {e}")
            time.sleep(5)

class LicensePlateProcessor:
    def __init__(self, max_queue_size=100000):
        self.processed_images = set()
        self.processing_queue = Queue(maxsize=max_queue_size)
        self.processing_thread = threading.Thread(target=self._process_queue)
        self.processing_thread.daemon = True
        self.running = True
        
        # Create extraction script file
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "extract_script.py")
        with open(script_path, "w") as f:
            f.write(EXTRACTION_SCRIPT)
        self.script_path = script_path
        
        # Start processing thread
        self.processing_thread.start()
    
    def _process_queue(self):
        while self.running:
            try:
                if not self.processing_queue.empty():
                    image_path = self.processing_queue.get()
                    self._process_single_image(image_path)
                    self.processing_queue.task_done()
                else:
                    time.sleep(1)
            except Exception as e:
                logger.error(f"Error in processing queue: {e}")
                time.sleep(1)
    
    def _process_single_image(self, image_path):
        # Skip if already processed
        image_path = os.path.abspath(image_path)
        if image_path in self.processed_images:
            logger.info(f"Image already processed: {os.path.basename(image_path)}")
            return
        
        # Run the extraction in a separate process
        try:
            logger.info(f"Processing image: {os.path.basename(image_path)}")
            cmd = [sys.executable, self.script_path, image_path]
            
            # Set timeout for subprocess (adjust as needed)
            timeout = 120  # seconds
            
            # Run the process with captured output
            process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                text=True
            )
            
            try:
                stdout, stderr = process.communicate(timeout=timeout)
                
                if process.returncode == 0 and stdout:
                    license_plate = stdout.strip()
                    logger.info(f"License plate for {os.path.basename(image_path)}: {license_plate}")
                    # Add to processed images set
                    self.processed_images.add(image_path)
                else:
                    logger.error(f"Extraction failed for {os.path.basename(image_path)}")
                    if stderr:
                        logger.error(f"Error: {stderr}")
            except subprocess.TimeoutExpired:
                logger.error(f"Processing timed out for {os.path.basename(image_path)}")
                # Kill the process
                process.kill()
                process.communicate()
                
            # Ensure we clean up after ourselves
            gc.collect()
                
        except Exception as e:
            logger.error(f"Error processing image {os.path.basename(image_path)}: {str(e)}")
    
    def enqueue_image(self, image_path):
        try:
            # Check if image is valid
            try:
                with Image.open(image_path) as img:
                    # Just checking if it loads properly
                    width, height = img.size
                    
                    # If image is too large, resize it
                    if width > 2000 or height > 2000:
                        logger.info(f"Resizing large image: {os.path.basename(image_path)}")
                        img = img.resize(
                            (min(width, 2000), min(height, 2000)), 
                            Image.LANCZOS
                        )
                        img.save(image_path)
            except Exception as e:
                logger.error(f"Invalid image file {os.path.basename(image_path)}: {str(e)}")
                return False
                
            # Add to queue if not already processed
            if image_path not in self.processed_images:
                # Use non-blocking put with timeout
                try:
                    self.processing_queue.put(image_path, block=True, timeout=5)
                    return True
                except Exception:
                    logger.warning(f"Queue full, skipping image: {os.path.basename(image_path)}")
                    return False
            return False
        except Exception as e:
            logger.error(f"Error enqueueing image {os.path.basename(image_path)}: {str(e)}")
            return False
    
    def stop(self):
        self.running = False
        # Wait for processing to complete
        if self.processing_thread.is_alive():
            self.processing_thread.join(timeout=10)

# File event handler class
class ImageEventHandler(FileSystemEventHandler):
    def __init__(self, processor):
        self.processor = processor
        self.image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff']
        
    def on_created(self, event):
        # Skip directories
        if event.is_directory:
            return
            
        # Wait a moment to ensure the file is fully written
        time.sleep(1)
            
        # Check if the new file is an image
        file_extension = os.path.splitext(event.src_path)[1].lower()
        
        if file_extension in self.image_extensions:
            logger.info(f"New image detected: {os.path.basename(event.src_path)}")
            self.processor.enqueue_image(event.src_path)

def watch_folder(folder_path):
    # Create the folder if it doesn't exist
    folder_path = os.path.abspath(folder_path)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        logger.info(f"Created folder: {folder_path}")
    
    # Initialize the memory monitor
    memory_monitor = MemoryMonitor(threshold_percent=75)
    memory_monitor.start()
    
    # Initialize the license plate processor
    processor = LicensePlateProcessor()
    
    # Process any existing images in the folder
    logger.info("Checking for existing images in the folder...")
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff']
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path) and any(filename.lower().endswith(ext) for ext in image_extensions):
            logger.info(f"Found existing image: {filename}")
            processor.enqueue_image(file_path)
    
    # Set up the event handler and observer
    event_handler = ImageEventHandler(processor)
    observer = Observer()
    observer.schedule(event_handler, folder_path, recursive=False)
    
    # Start the observer
    logger.info(f"Watching folder: {folder_path}")
    logger.info("Waiting for new images...")
    observer.start()
    
    try:
        # Keep the program running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        # Stop observer and processor
        observer.stop()
        processor.stop()
        memory_monitor.stop()
        logger.info("Folder watching stopped")
    
    observer.join()

if __name__ == "__main__":
    # Folder to monitor - change this to your desired folder
    WATCH_FOLDER = "./pics"
    
    # Start watching the folder
    watch_folder(WATCH_FOLDER)

