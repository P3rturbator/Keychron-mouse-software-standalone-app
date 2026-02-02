const HID = require('node-hid');
const { setInterval, clearInterval } = require('timers');
const EventEmitter = require('events');

class HIDHandler extends EventEmitter {
  constructor(ipcMain, mainWindow) {
    super();
    this.ipcMain = ipcMain;
    this.mainWindow = mainWindow;
    this.device = null;
    this.batteryInterval = null;
    this.connectedDevicePath = null;

    this.setupIPCHandlers();
    this.startDiscovery();
  }

  setupIPCHandlers() {
    this.ipcMain.handle('hid-get-devices', () => {
      return this.listKeychronDevices();
    });

    this.ipcMain.handle('hid-connect', (event, path) => {
      return this.connect(path);
    });

    this.ipcMain.handle('hid-send-config', (event, config) => {
      return this.sendConfig(config);
    });
  }

  listKeychronDevices() {
    const devices = HID.devices();
    return devices.filter(d =>
      d.vendorId === 0x3434 &&
      (d.usagePage === 0xFF00 || d.interface === 1 || d.interface === 2 || d.interface === 3)
    ).sort((a, b) => {
      // Prioritize usagePage 0xFF00 (Vendor Specific)
      if (a.usagePage === 0xFF00 && b.usagePage !== 0xFF00) return -1;
      if (b.usagePage === 0xFF00 && a.usagePage !== 0xFF00) return 1;
      return 0;
    });
  }

  startDiscovery() {
    // Basic polling for device changes
    setInterval(() => {
      const devices = this.listKeychronDevices();
      this.mainWindow.webContents.send('device-status', {
        type: 'discovery',
        devices: devices
      });
    }, 10000);
  }

  connect(path) {
    try {
      if (this.device && this.connectedDevicePath === path) {
        return { success: true, alreadyConnected: true };
      }

      if (this.device) {
        this.disconnect();
      }

      console.log('Connecting to HID device:', path);
      this.device = new HID.HID(path);
      this.connectedDevicePath = path;

      this.device.on('error', (err) => {
        console.log('HID Device Error:', err);
        this.disconnect();
      });

      this.device.on('data', (data) => {
        this.handleData(data);
      });

      // Give the device a moment to settle before polling
      setTimeout(() => {
        if (this.device && this.connectedDevicePath === path) {
          this.startBatteryPolling();
        }
      }, 500);

      return { success: true };
    } catch (error) {
      console.error('Failed to connect to HID device:', error);
      return { success: false, error: error.message };
    }
  }

  disconnect() {
    if (this.device) {
      this.device.close();
      this.device = null;
    }
    this.stopBatteryPolling();
    this.connectedDevicePath = null;
    this.mainWindow.webContents.send('device-status', { type: 'disconnected' });
  }

  handleData(data) {
    // On Windows, data[0] is often the Report ID (0x00 for raw HID)
    let offset = 0;
    if (data[0] === 0x00) {
      offset = 1;
    }

    // Battery report (0x07 0x02 or 0x08 0x02)
    if ((data[offset] === 0x07 || data[offset] === 0x08) && data[offset + 1] === 0x02) {
      const battery = data[offset + 2];
      const isCharging = data[offset + 3] === 0x01;
      this.mainWindow.webContents.send('battery-update', {
        percentage: battery,
        isCharging: isCharging
      });
      this.emit('battery-update', {
        percentage: battery,
        isCharging: isCharging
      });
    }
  }

  startBatteryPolling() {
    this.stopBatteryPolling();
    // Query battery every 60 seconds
    this.batteryInterval = setInterval(() => {
      this.queryBattery();
    }, 60000);
    // Initial query
    this.queryBattery();
  }

  stopBatteryPolling() {
    if (this.batteryInterval) {
      clearInterval(this.batteryInterval);
      this.batteryInterval = null;
    }
  }

  safeWrite(data) {
    if (!this.device) return;
    try {
      // Try 65 bytes (Report ID 0 + 64 bytes data)
      const report65 = Buffer.alloc(65);
      data.forEach((val, i) => { if (i < 65) report65[i] = val; });
      this.device.write(report65);
    } catch (e) {
      try {
        // Try 64 bytes (Raw data)
        const report64 = Buffer.alloc(64);
        data.forEach((val, i) => { if (i > 0 && i < 65) report64[i-1] = val; });
        this.device.write(report64);
      } catch (e2) {
        throw new Error(`HID Write failed: ${e.message} / ${e2.message}`);
      }
    }
  }

  queryBattery() {
    if (!this.device) return;
    try {
      // Primary battery query (0x07 0x02)
      this.safeWrite([0x00, 0x07, 0x02]);

      // Fallback battery query (0x08 0x02)
      this.safeWrite([0x00, 0x08, 0x02]);
    } catch (error) {
      console.log('Failed to query battery:', error.message);
    }
  }

  sendConfig(config) {
    if (!this.device) return { success: false, error: 'No device connected' };
    try {
      // DPI
      if (config.dpi !== undefined) {
        const report = [0x00, 0x07, 0x03, config.dpiIndex, (config.dpi >> 8) & 0xFF, config.dpi & 0xFF];
        this.safeWrite(report);
      }

      // Polling Rate
      if (config.pollingRate !== undefined) {
        const report = [0x00, 0x07, 0x04, config.pollingRateIndex];
        this.safeWrite(report);
      }

      // RGB
      if (config.rgb) {
        const report = [0x00, 0x07, 0x06, config.rgb.mode, config.rgb.speed, config.rgb.brightness, config.rgb.r, config.rgb.g, config.rgb.b];
        this.safeWrite(report);
      }

      // Buttons
      if (config.button) {
        const report = [0x00, 0x07, 0x05, config.button.index, config.button.action];
        this.safeWrite(report);
      }

      // Performance (LOD)
      if (config.lod !== undefined) {
        const report = [0x00, 0x07, 0x07, config.lod];
        this.safeWrite(report);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send config:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = HIDHandler;
