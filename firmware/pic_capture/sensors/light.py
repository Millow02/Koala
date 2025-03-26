import smbus2
import time

class LTR329:
    # LTR-329 Register Addresses
    ALS_CONTR = 0x80  # ALS operation mode control
    ALS_MEAS_RATE = 0x85  # ALS measurement rate
    ALS_DATA_CH1_0 = 0x88  # ALS measurement CH1 data - low byte
    ALS_DATA_CH1_1 = 0x89  # ALS measurement CH1 data - high byte
    ALS_DATA_CH0_0 = 0x8A  # ALS measurement CH0 data - low byte
    ALS_DATA_CH0_1 = 0x8B  # ALS measurement CH0 data - high byte

    def __init__(self, i2c_bus=1, address=0x29):
        """Initialize the LTR-329 light sensor.
        
        Args:
            i2c_bus (int): I2C bus number
            address (int): I2C device address (default 0x29)
        """
        self.bus = smbus2.SMBus(i2c_bus)
        self.address = address
        self.init_sensor()

    def init_sensor(self):
        """Initialize the sensor with default settings."""
        # Set ALS to active mode (0x01) and gain to 1x (0x00)
        self.bus.write_byte_data(self.address, self.ALS_CONTR, 0x01)
        # Set integration time to 100ms (0x02) and measurement rate to 500ms (0x01)
        self.bus.write_byte_data(self.address, self.ALS_MEAS_RATE, 0x21)
        time.sleep(0.1)  # Wait for settings to take effect

    def read_light(self):
        """Read light intensity from both channels.
        
        Returns:
            tuple: (ch0_value, ch1_value) in raw ADC counts
        """
        # Read both channels
        ch1_low = self.bus.read_byte_data(self.address, self.ALS_DATA_CH1_0)
        ch1_high = self.bus.read_byte_data(self.address, self.ALS_DATA_CH1_1)
        ch0_low = self.bus.read_byte_data(self.address, self.ALS_DATA_CH0_0)
        ch0_high = self.bus.read_byte_data(self.address, self.ALS_DATA_CH0_1)

        # Combine high and low bytes
        ch0 = (ch0_high << 8) | ch0_low
        ch1 = (ch1_high << 8) | ch1_low

        return ch0, ch1

    def get_lux(self):
        """Calculate approximate lux value.
        
        Returns:
            float: Calculated lux value
        """
        ch0, ch1 = self.read_light()
        
        # Simple lux calculation (you may need to adjust coefficients based on your setup)
        lux = (ch0 + ch1) * 0.5  # Simplified conversion
        return lux

    def cleanup(self):
        """Cleanup the sensor."""
        try:
            # Put sensor in standby mode
            self.bus.write_byte_data(self.address, self.ALS_CONTR, 0x00)
            self.bus.close()
        except:
            pass
