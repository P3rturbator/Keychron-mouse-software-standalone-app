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
      (d.usagePage === 0xFF00 || d.interface === 1 || d.interface === 2)
    );
  }

  startDiscovery() {
    // Basic polling for device changes
    setInterval(() => {
      const devices = this.listKeychronDevices();
      this.mainWindow.webContents.send('device-status', {
        type: 'discovery',
        devices: devices
      });
    }, 5000);
  }

  connect(path) {
    try {
      if (this.device) {
        this.disconnect();
      }

      this.device = new HID.HID(path);
      this.connectedDevicePath = path;

      this.device.on('error', (err) => {
        console.error('HID Device Error:', err);
        this.disconnect();
      });

      this.device.on('data', (data) => {
        this.handleData(data);
      });

      this.startBatteryPolling();
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

  queryBattery() {
    if (!this.device) return;
    try {
      // Primary battery query (0x07 0x02)
      const report1 = new Array(65).fill(0);
      report1[0] = 0x00;
      report1[1] = 0x07;
      report1[2] = 0x02;
      this.device.write(report1);

      // Fallback battery query (0x08 0x02)
      const report2 = new Array(65).fill(0);
      report2[0] = 0x00;
      report2[1] = 0x08;
      report2[2] = 0x02;
      this.device.write(report2);
    } catch (error) {
      console.error('Failed to query battery:', error);
    }
  }

  sendConfig(config) {
    if (!this.device) return { success: false, error: 'No device connected' };
    try {
      // DPI
      if (config.dpi !== undefined) {
        const report = new Array(65).fill(0);
        report[0] = 0x00;
        report[1] = 0x07;
        report[2] = 0x03;
        report[3] = config.dpiIndex;
        report[4] = (config.dpi >> 8) & 0xFF;
        report[5] = config.dpi & 0xFF;
        this.device.write(report);
      }

      // Polling Rate
      if (config.pollingRate !== undefined) {
        const report = new Array(65).fill(0);
        report[0] = 0x00;
        report[1] = 0x07;
        report[2] = 0x04;
        report[3] = config.pollingRateIndex;
        this.device.write(report);
      }

      // RGB
      if (config.rgb) {
        const report = new Array(65).fill(0);
        report[0] = 0x00;
        report[1] = 0x07;
        report[2] = 0x06;
        report[3] = config.rgb.mode;
        report[4] = config.rgb.speed;
        report[5] = config.rgb.brightness;
        report[6] = config.rgb.r;
        report[7] = config.rgb.g;
        report[8] = config.rgb.b;
        this.device.write(report);
      }

      // Buttons
      if (config.button) {
        const report = new Array(65).fill(0);
        report[0] = 0x00;
        report[1] = 0x07;
        report[2] = 0x05;
        report[3] = config.button.index;
        report[4] = config.button.action;
        this.device.write(report);
      }

      // Performance (LOD)
      if (config.lod !== undefined) {
        const report = new Array(65).fill(0);
        report[0] = 0x00;
        report[1] = 0x07;
        report[2] = 0x07;
        report[3] = config.lod; // 1 or 2
        this.device.write(report);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send config:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = HIDHandler;
