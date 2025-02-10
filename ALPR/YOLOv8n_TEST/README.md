Instuctions to run:

run this first:
salloc --mem=50G --gpus=1 --constraint=el9 --account=capstone

Once you run it: run the following:
module load python/3.11.5/default
setenv PIP_CACHE_DIR /speed-scratch/$USER/tmp/cache
source /speed-scratch/$USER/tmp/jupyter-venv/bin/activate.csh
jupyter lab --no-browser --notebook-dir=$PWD --ip="0.0.0.0" --port=8888 --port-retries=50

Once this is done, note the node umber and port and

run the following command:
> ssh -L 8888:speed-XX:8888 <ENCS-username>@speed-submit.encs.concordia.ca

Token for Loggin in:

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

