# Keychron Mouse Configuration Tool

Offline Windows 11 Electron application for Keychron M-series mice.

## Features
- DPI configuration
- Polling rate selection
- Button remapping
- Lighting / RGB settings
- Battery monitoring in system tray

## How to Start (Simple Guide)

If you are not tech-savvy, just follow these simple steps:

1. **Install Node.js**: Download and install the "LTS" version of Node.js from [https://nodejs.org/](https://nodejs.org/).
2. **Download the app**: Download this project folder to your computer.
3. **Run the App**: Double-click the `start.bat` file in the main folder. It will automatically set everything up and open the application for you.

---

## Development (For Tech Savvy Users)
```bash
npm install
npm start
```

## Creating an Installer (.exe)
To create a standalone Windows installer:
```bash
npm run build
```
The installer will be created in the `dist/` folder.
