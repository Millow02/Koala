# SPDX-FileCopyrightText: Copyright (c) 2022 ladyada for Adafruit Industries
#
# SPDX-License-Identifier: Unlicense
import time
import board
from adafruit_ltr329_ltr303 import LTR329

class LightSensor:
    def __init__(self, threshold=100):
        """Initialize the light sensor.
        
        Args:
            threshold (int): Light level threshold below which is_dark will be True
        """
        # Initialize I2C
        self.i2c = board.I2C()  # uses board.SCL and board.SDA
        time.sleep(0.1)  # sensor takes 100ms to 'boot' on power up
        self.sensor = LTR329(self.i2c)
        self.threshold = threshold
        
    @property
    def visible_plus_ir(self):
        """Get visible plus infrared light reading."""
        return self.sensor.visible_plus_ir_light
        
    @property
    def ir_light(self):
        """Get infrared light reading."""
        return self.sensor.ir_light
        
    @property
    def is_dark(self):
        """Check if the light level is below threshold."""
        return self.visible_plus_ir < self.threshold
        
    def read_values(self):
        """Read all sensor values.
        
        Returns:
            dict: Dictionary containing sensor readings
        """
        return {
            'visible_plus_ir': self.visible_plus_ir,
            'ir_light': self.ir_light,
            'is_dark': self.is_dark
        }
