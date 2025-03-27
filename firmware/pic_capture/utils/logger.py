from loguru import logger
import os
import sys

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Remove any existing handlers
logger.remove()

# Add a handler for stdout
logger.add(sys.stdout, format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>")

# Add a handler for file
logger.add(
    "logs/app.log",
    rotation="10 MB",
    retention="1 week",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
)
