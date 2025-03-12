1. Create .venv
2. run pip install -r requirements.txt

There is an issue where the program does not detect the alpr header.
Before running register ALPR as the root dir:

```bash
export PYTHONPATH="/home/z4hed/COEN490/Koala/ALPR:$PYTHONPATH"
```

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
