# SPDX-FileCopyrightText: Copyright (c) 2022 ladyada for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense
import time
import smbus2

# LTR329 constants
_LTR329_ADDR = 0x29
_LTR329_PART_ID = 0x0A
_LTR329_MANUFAC_ID = 0x0B
_LTR329_ALS_CTRL = 0x80
_LTR329_ALS_MEAS_RATE = 0x85
_LTR329_ALS_DATA_CH1_0 = 0x88
_LTR329_ALS_DATA_CH1_1 = 0x89
_LTR329_ALS_DATA_CH0_0 = 0x8A
_LTR329_ALS_DATA_CH0_1 = 0x8B

class LightSensor:
    def __init__(self, threshold=100, channel=1):
        """Initialize the light sensor.
        
        Args:
            threshold (int): Light level threshold below which is_dark will be True
            channel (int): I2C bus number (usually 1 on Raspberry Pi)
        """
        self.channel = channel
        self.bus = smbus2.SMBus(channel)
        self.threshold = threshold
        
        # Initialize the sensor
        time.sleep(0.1)  # sensor takes 100ms to 'boot' on power up
        
        # Configure sensor
        self.bus.write_byte_data(_LTR329_ADDR, _LTR329_ALS_CTRL, 0x01)  # Active mode
        self.bus.write_byte_data(_LTR329_ADDR, _LTR329_ALS_MEAS_RATE, 0x03)  # 500ms integration time
        
    def _read_als_data(self):
        """Read the ALS data registers and calculate light values."""
        # Read the four bytes of ALS data
        ch1_0 = self.bus.read_byte_data(_LTR329_ADDR, _LTR329_ALS_DATA_CH1_0)
        ch1_1 = self.bus.read_byte_data(_LTR329_ADDR, _LTR329_ALS_DATA_CH1_1)
        ch0_0 = self.bus.read_byte_data(_LTR329_ADDR, _LTR329_ALS_DATA_CH0_0)
        ch0_1 = self.bus.read_byte_data(_LTR329_ADDR, _LTR329_ALS_DATA_CH0_1)
        
        # Combine bytes into 16-bit values
        ch1 = (ch1_1 << 8) | ch1_0  # IR
        ch0 = (ch0_1 << 8) | ch0_0  # Visible + IR
        
        return ch0, ch1
    
    @property
    def visible_plus_ir(self):
        """Get visible plus infrared light reading."""
        ch0, _ = self._read_als_data()
        return ch0
        
    @property
    def ir_light(self):
        """Get infrared light reading."""
        _, ch1 = self._read_als_data()
        return ch1
        
    @property
    def is_dark(self):
        """Check if the light level is below threshold."""
        return self.visible_plus_ir < self.threshold
        
    def read_values(self):
        """Read all sensor values.
        
        Returns:
            dict: Dictionary containing sensor readings
        """
        ch0, ch1 = self._read_als_data()
        return {
            'visible_plus_ir': ch0,
            'ir_light': ch1,
            'is_dark': ch0 < self.threshold
        }
