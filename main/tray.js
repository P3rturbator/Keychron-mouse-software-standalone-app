const { Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');

class TrayHandler {
  constructor(app, mainWindow, hidHandler) {
    this.app = app;
    this.mainWindow = mainWindow;
    this.hidHandler = hidHandler;
    this.tray = null;
    this.batteryPercentage = null;
    this.isCharging = false;
    this.deviceName = 'Keychron Mouse';

    this.initTray();
    this.setupListeners();
  }

  initTray() {
    // Create a simple placeholder icon (Red square for visibility)
    const iconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAX0lEQVR42mP8z8AARCAWAsQsQMwExEBMD6AGMM6AAYhZgJgJiIGYHkANEMyAAIgZgJgZiIGYHkANEMyAAIidgJgZiIGYHkANEMyAAIgZgJgZiIGYHkANEMyAAAEEAARSAZ2H4Y73AAAAAElFTkSuQmCC';
    const icon = nativeImage.createFromBuffer(Buffer.from(iconBase64, 'base64'));

    this.tray = new Tray(icon);
    this.updateContextMenu();
    this.updateToolTip();

    this.tray.on('double-click', () => {
      this.mainWindow.show();
    });
  }

  setupListeners() {
    // Listen for battery updates from HID handler directly via event emitter
    this.hidHandler.on('battery-update', (data) => {
      this.batteryPercentage = data.percentage;
      this.isCharging = data.isCharging;
      this.updateToolTip();
    });
  }

  updateToolTip() {
    let tooltip = `${this.deviceName}\n`;
    if (this.batteryPercentage !== null) {
      tooltip += `Battery: ${this.batteryPercentage}%\nStatus: ${this.isCharging ? 'Charging' : 'Discharging'}`;
    } else {
      tooltip += 'Battery: Unknown';
    }
    this.tray.setToolTip(tooltip);
  }

  updateContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Configuration', click: () => this.mainWindow.show() },
      { label: 'Refresh Battery Status', click: () => this.hidHandler.queryBattery() },
      { type: 'separator' },
      { label: 'Exit', click: () => {
        this.app.isQuitting = true;
        this.app.quit();
      } }
    ]);
    this.tray.setContextMenu(contextMenu);
  }
}

module.exports = TrayHandler;
