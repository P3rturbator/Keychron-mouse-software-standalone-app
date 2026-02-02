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
    return devices.filter(d => d.vendorId === 0x3434);
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
    // Logic to parse reports from the mouse
    // e.g., Battery report
    if (data[0] === 0x07 && data[1] === 0x02) {
      const battery = data[2];
      const isCharging = data[3] === 0x01;
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
      // Placeholder for battery query command
      const report = new Array(64).fill(0);
      report[0] = 0x07;
      report[1] = 0x02;
      this.device.write(report);
    } catch (error) {
      console.error('Failed to query battery:', error);
    }
  }

  sendConfig(config) {
    if (!this.device) return { success: false, error: 'No device connected' };
    try {
      // config might contain dpi, pollingRate, etc.
      if (config.dpi !== undefined) {
        const report = new Array(64).fill(0);
        report[0] = 0x07;
        report[1] = 0x03;
        report[2] = config.dpiIndex;
        report[3] = (config.dpi >> 8) & 0xFF;
        report[4] = config.dpi & 0xFF;
        this.device.write(report);
      }

      if (config.pollingRate !== undefined) {
        const report = new Array(64).fill(0);
        report[0] = 0x07;
        report[1] = 0x04;
        report[2] = config.pollingRateIndex; // 0:125, 1:250, 2:500, 3:1000
        this.device.write(report);
      }

      /**
       * FUTURE: Implement additional HID commands here.
       *
       * Button Remapping:
       * if (config.buttons) { ... }
       *
       * RGB Lighting:
       * if (config.rgb) { ... }
       *
       * Reference docs/protocol.md for more details.
       */

      return { success: true };
    } catch (error) {
      console.error('Failed to send config:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = HIDHandler;
