const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window control
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Settings
  getSettings: (key) => ipcRenderer.invoke('get-settings', key),
  setSettings: (key, value) => ipcRenderer.invoke('set-settings', key, value),

  // HID
  getDevices: () => ipcRenderer.invoke('hid-get-devices'),
  connectDevice: (path) => ipcRenderer.invoke('hid-connect', path),
  sendConfig: (config) => ipcRenderer.invoke('hid-send-config', config),

  // Events
  onBatteryUpdate: (callback) => ipcRenderer.on('battery-update', (event, data) => callback(data)),
  onDeviceStatus: (callback) => ipcRenderer.on('device-status', (event, data) => callback(data)),
});
