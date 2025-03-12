1. Create .venv
2. run pip install -r requirements.txt

There is an issue where the program does not detect the alpr header.
Before running register ALPR as the root dir:

```bash
export PYTHONPATH="/home/z4hed/COEN490/Koala/ALPR:$PYTHONPATH"
```

# Load supabase URL and SERVICE_KEY

Make sure you put the `.env` file at the root of ALPR (aka this folder)

# How to stop

Please press `Ctrl + C` to stop the service
