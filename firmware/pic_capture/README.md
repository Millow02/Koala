# Koala Camera Capture System

This project implements an intelligent camera capture system with various sensors and cloud synchronization capabilities.

## System Service

The camera capture functionality runs as a systemd service for automatic startup and management.

### Service Location
The service file is located at: `/etc/systemd/system/koala-capture.service`

### Service Management
```bash
# Enable the service (start on boot)
sudo systemctl enable koala-capture.service

# Disable the service
sudo systemctl disable koala-capture.service

# Start the service
sudo systemctl start koala-capture.service

# Stop the service
sudo systemctl stop koala-capture.service

# Check service status
sudo systemctl status koala-capture.service

# Reload service configuration
sudo systemctl daemon-reload
```

## Project Structure

### Firmware
The main firmware components are located in `/firmware/pic_capture/`:

- `src.py` - Main application entry point
- `utils/`
  - `logger.py` - Logging configuration and utilities

#### Sensors
Located in `sensors/`:
- `camera.py` - Camera control and image capture
- `pir.py` - PIR motion sensor interface
- `light.py` - Light sensor integration
- `ultra.py` - Ultrasonic sensor functionality

#### Cloud Integration
Located in `sync/`:
- `cloud_sync.py` - Handles synchronization with cloud services

### Additional Components

#### ALPR (Automatic License Plate Recognition)
Located in `ALPR/alpr/`:
- `rectification.py` - Image rectification for license plate detection

#### Light Sensor
Located in `light_sensor/`:
- `light_sensor.py` - Standalone light sensor implementation

## Logs
System logs are stored in `firmware/pic_capture/logs/`:
- `camera.log` - Camera operation logs

## Service Configuration

The service runs under the following configuration:
```ini
[Unit]
Description=Koala Camera Capture Service
After=network.target

[Service]
Type=simple
User=angewoah
WorkingDirectory=/home/angewoah/Desktop/koala/Koala/firmware/pic_capture
ExecStart=/usr/bin/python3 /home/angewoah/Desktop/koala/Koala/firmware/pic_capture/src.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Components Description

1. **Camera Module**
   - Handles image capture and processing
   - Integrates with other sensors for intelligent capture timing

2. **PIR Sensor**
   - Detects motion in the environment
   - Triggers camera capture when movement is detected

3. **Light Sensor**
   - Monitors ambient light levels
   - Helps optimize camera settings based on lighting conditions

4. **Ultrasonic Sensor**
   - Measures distance to objects
   - Used for proximity-based capture triggering

5. **Cloud Sync**
   - Manages data synchronization with cloud services
   - Handles upload of captured images and sensor data

6. **ALPR System**
   - Processes images for license plate recognition
   - Includes image rectification for improved accuracy

## Troubleshooting

If the service fails to start:
1. Check the system logs: `journalctl -u koala-capture.service`
2. Verify file permissions in the project directory
3. Ensure all Python dependencies are installed
4. Check the camera and sensor connections
5. Verify the working directory exists and is accessible

## Dependencies

- Python 3.x
- Required Python packages (list to be maintained)
- Hardware:
  - Camera module
  - PIR sensor
  - Light sensor
  - Ultrasonic sensor
