# ALPR (Automatic License Plate Recognition)

[![Python 3.9+](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)  

## Overview

This **Automatic License Plate Recognition (ALPR)** system is part of the **Koala** project, designed to identify and track license plates using:
- **YOLOv11** for object detection,
- **Custom CNN models** for classification,
- And supporting libraries to run efficiently even on resource-constrained devices like the Raspberry Pi.

---

## Features

- **Real-time license plate detection** and recognition
- **Lightweight and efficient** for edge devices
- **Modular design** for easy integration into larger systems
- **Python-based** for cross-platform compatibility

---

## Project Structure

```
ALPR/
├─ alpr/          # Core ALPR modules (detection, recognition, etc.)
├─ demo/          # Example scripts or notebooks for demonstration
├─ models/        # Pretrained YOLO or custom CNN models
├─ openalpr/      # Additional or third-party ALPR tools (if any)
├─ requirements.txt
├─ README.md
└─ ...
```

---

## Getting Started

Follow these steps to set up your development environment and run the ALPR system.

### 1. Create a Virtual Environment

From within the `ALPR` directory (or the root project directory), create and activate a Python virtual environment:

```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment (Windows)
.\.venv\Scripts\activate

# Activate the virtual environment (macOS/Linux)
source .venv/bin/activate
```

### 2. Install Dependencies

Once the virtual environment is activated, install the required packages:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Set the PYTHONPATH

Before running the ALPR scripts, ensure the `ALPR` folder is recognized as the root directory:


```bash
export PYTHONPATH="/home/z4hed/COEN490/Koala/ALPR:$PYTHONPATH"
```

# FROM MINH

# Testing

- make sure you at this git branch `pi2supabase`
- open a terminal, `cd` into the `firmware/pic_capture`
- run the python script with `python3 src.py`

- open another terminal: `cd` into `ALPR`
- open a new python virtual environment or reuse an old one, should use python version 3.8.20
- make sure you installed all the python dependencies with `pip3 install -r requirements.txt`
- run the script with `python3 demo/alpr_top.py` and just let it run, you can manually putting images into the `Koala/ALPR/pics` folder or just trigger the sensor to get new images (these new images will be put into the `pics` folder automatically.

# Load supabase URL and SERVICE_KEY

Make sure you put the `.env` file at the root of ALPR (aka this folder)

# How to stop

Please press `Ctrl + C` to stop the service
=======

### 4. Usage

You can now run the ALPR system. For example:

```bash
python demo/alpr top.py
```

---

## Contributing

We welcome contributions! Please open an issue or submit a pull request for any feature requests, bug fixes, or improvements.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](../LICENSE) file in the repository root for details.

---

## Contact & Acknowledgements

- **Koala Team**:  
  Scott McDonald, Angelo Reolegio, Rihazul Islam, Mohammed Zahed, Niraj Patel, Minh Tran, Barthalomew Quantavius

If you have questions or feedback, feel free to reach out to any of the team members or open an issue in the repository.

---

*Happy coding and plate tracking!*

