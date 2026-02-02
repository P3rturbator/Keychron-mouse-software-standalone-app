const EventEmitter = require('events');

// Mock node-hid
const mockHID = {
  devices: () => [
    { vendorId: 0x3434, productId: 0x0111, productName: 'Mock Keychron M3', path: 'mock-path', usagePage: 0xFF00 }
  ],
  HID: class extends EventEmitter {
    constructor(path) {
      super();
      console.log(`HID: Connected to ${path}`);
    }
    write(data) {
      console.log(`HID: Writing data:`, data.slice(0, 8));
      // Simulate Windows picky behavior
      if (data.length === 65 && data[0] !== 0x00) {
        throw new Error('TypeError: Cannot write to hid device');
      }

      // Simulate response
      // data[0] is 0x00 (Report ID), data[1] is 0x07 or 0x08, data[2] is 0x02
      if (data[0] === 0x00 && (data[1] === 0x07 || data[1] === 0x08) && data[2] === 0x02) {
        setTimeout(() => {
          this.emit('data', Buffer.from([0x00, data[1], 0x02, 85, 0x00])); // Prepend 0x00
        }, 100);
      }
    }
    close() {
      console.log(`HID: Closed`);
    }
  }
};

// Add to require cache
require.cache[require.resolve('node-hid')] = {
  exports: mockHID
};

const HIDHandler = require('../main/hid');

// Mock IPC
const mockIpcMain = {
  handle: (channel, callback) => {
    console.log(`IPC: Registered handler for ${channel}`);
  }
};

// Mock MainWindow
const mockMainWindow = {
  webContents: {
    send: (channel, data) => {
      console.log(`IPC: Sending ${channel}`, data);
    }
  }
};

console.log('--- Starting Mock HID Test ---');
const handler = new HIDHandler(mockIpcMain, mockMainWindow);

console.log('Testing device list...');
const devices = handler.listKeychronDevices();
console.log('Devices:', devices);

console.log('Testing connection...');
const connResult = handler.connect('mock-path');
console.log('Connection result:', connResult);


setTimeout(() => {
  console.log('Testing config send...');
  handler.sendConfig({ dpi: 1600, dpiIndex: 3 });
  handler.sendConfig({ pollingRate: 1000, pollingRateIndex: 3 });
  handler.sendConfig({ rgb: { mode: 1, speed: 5, brightness: 50, r: 0, g: 120, b: 212 } });
  handler.sendConfig({ button: { index: 4, action: 10 } });
  handler.sendConfig({ lod: 1 });

  console.log('--- Test Complete ---');
  process.exit(0);
}, 500);
