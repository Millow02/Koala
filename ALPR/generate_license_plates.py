import os
import subprocess
import json

# Directory containing the images
image_directory = "./Pics/Train/"
output_directory = "./Pics/TrainOutputs/"

# Ensure the output directory exists
os.makedirs(output_directory, exist_ok=True)


def parse_alpr_output(alpr_json):
    """
    Parse the ALPR JSON output and return the license plate with the highest confidence.

    Args:
        alpr_json (str): The ALPR JSON string.

    Returns:
        str: The license plate with the highest confidence.
    """
    try:
        data = json.loads(alpr_json)  # Parse the JSON string into a dictionary

        if "results" not in data or len(data["results"]) == 0:
            return "No plate detected"

        # Get the first result's best plate and confidence
        best_result = data["results"][0]
        best_plate = best_result["plate"]
        best_confidence = best_result["confidence"]

        return f"Best Plate: {best_plate} (Confidence: {best_confidence:.2f})"

    except json.JSONDecodeError:
        return "Invalid JSON format"

# Loop through the files in the directory
for filename in os.listdir(image_directory):
    if filename.endswith(".jpg") or filename.endswith(".png"):
        # Full path to the image file
        image_path = os.path.join(image_directory, filename)
        
        # Generate the corresponding text filename
        base_name = os.path.splitext(filename)[0]  # Remove file extension
        txt_filename = f"{base_name}.txt"
        txt_path = os.path.join(output_directory, txt_filename)
        
        # Run the OpenALPR command to detect license plate
        try:
            result = subprocess.run(
                ["alpr", "-j", image_path],
                capture_output=True,
                text=True
            )
            
            # Parse the output JSON to extract the plate number
            if result.returncode == 0:
                alpr_output = result.stdout
                
                with open(txt_path, "w") as txt_file:
                    txt_file.write(parse_alpr_output(alpr_output) + "\n")
            else:
                print(f"Error processing {filename}: {result.stderr}")

        except Exception as e:
            print(f"Failed to run OpenALPR for {filename}: {str(e)}")


print("Processing completed.")
