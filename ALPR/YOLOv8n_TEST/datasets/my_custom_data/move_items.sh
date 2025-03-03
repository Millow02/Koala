#!/bin/bash

# Source and destination directories
SOURCE_DIR="$1"
DESTINATION_DIR="$2"

# Check if source and destination directories are provided
if [ -z "$SOURCE_DIR" ] || [ -z "$DESTINATION_DIR" ]; then
  echo "Usage: $0 <source_directory> <destination_directory>"
  exit 1
fi

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source directory '$SOURCE_DIR' does not exist."
  exit 1
fi

# Check if destination directory exists, create it if not
if [ ! -d "$DESTINATION_DIR" ]; then
  echo "Destination directory '$DESTINATION_DIR' does not exist. Creating it..."
  mkdir -p "$DESTINATION_DIR"
fi

# Move all .txt files
echo "Moving .txt files from '$SOURCE_DIR' to '$DESTINATION_DIR'..."
cp "$SOURCE_DIR"/*.jpg "$DESTINATION_DIR" 2>/dev/null

# Check if the move was successful
if [ $? -eq 0 ]; then
  echo "All .txt files moved successfully."
else
  echo "No .txt files found to move."
fi
