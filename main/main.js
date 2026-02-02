const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const store = require('./store');

let mainWindow;
let tray = null;
let hidHandler = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false, // Custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e1e',
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    const startMinimized = store.get('settings.startMinimized');
    if (!startMinimized) {
      console.log('Showing main window...');
      mainWindow.show();
    } else {
      console.log('Started minimized to tray.');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Initialize HID Handler
  const HIDHandler = require('./hid');
  hidHandler = new HIDHandler(ipcMain, mainWindow);

  // Initialize Tray
  const TrayHandler = require('./tray');
  tray = new TrayHandler(app, mainWindow, hidHandler);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // Keep app running in background for tray
  if (process.platform !== 'darwin') {
    // app.quit();
  }
});

// IPC Handlers for window control
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow.hide());

// Settings IPC
ipcMain.handle('get-settings', (event, key) => store.get(key));
ipcMain.handle('set-settings', (event, key, value) => {
  store.set(key, value);

  // Handle auto-start setting
  if (key === 'settings.autoStart') {
    app.setLoginItemSettings({
      openAtLogin: value,
      path: app.getPath('exe'),
    });
  }
});
