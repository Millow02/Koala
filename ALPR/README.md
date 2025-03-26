# ALPR

## Setup and Running

### Rasberry Pi setup

- make sure you at this git branch `pi2supabase`
- open a terminal, `cd` into the `firmware/pic_capture`
- run the python script with `python3 src.py`

### CloudGPU setup

- open another terminal: `cd` into `ALPR`
- open a new python virtual environment or reuse an old one, should use python version 3.10.16 `uv venv --python 3.10.16`
- make sure you installed all the python dependencies with `pip3 install -r requirements.txt`
- Use the llama.cpp version with GPU support: `CMAKE_ARGS="-DGGML_CUDA=on" uv pip install llama-cpp-python --upgrade --force-reinstall --no-cache-dir`
- Download the GGUF files: `wget -o Model-7.6B-Q4_K_M.gguf https://huggingface.co/openbmb/MiniCPM-o-2_6-gguf/resolve/main/Model-7.6B-Q4_K_M.gguf?download=true` and `wget -o mmproj-model-f16.gguf https://huggingface.co/openbmb/MiniCPM-o-2_6-gguf/resolve/main/mmproj-model-f16.gguf?download=true`
- run the script with `uv run cooked.py` and just let it run, you can manually putting images into the `Koala/ALPR/pics` folder or just trigger the sensor to get new images (these new images will be put into the `pics` folder automatically.

## Load supabase URL and SERVICE_KEY

Make sure you put the `.env` file at the root of ALPR (aka this folder)

## How to stop

Please press `Ctrl + C` to stop the service
