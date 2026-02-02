document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');

            navItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Window Controls
    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electronAPI.minimize();
    });

    document.getElementById('maximize-btn').addEventListener('click', () => {
        window.electronAPI.maximize();
    });

    document.getElementById('close-btn').addEventListener('click', () => {
        window.electronAPI.close();
    });

    // Device Status Updates
    let isConnected = false;
    window.electronAPI.onDeviceStatus((status) => {
        const deviceNameEl = document.getElementById('device-name');
        if (status.type === 'discovery' && status.devices.length > 0) {
            const device = status.devices[0];
            deviceNameEl.textContent = device.productName || 'Keychron Mouse';

            if (!isConnected) {
                window.electronAPI.connectDevice(device.path).then(result => {
                    if (result.success) {
                        isConnected = true;
                        console.log('Automatically connected to device');
                    }
                });
            }
        } else if (status.type === 'disconnected') {
            isConnected = false;
            deviceNameEl.textContent = 'No Device Connected';
            document.getElementById('battery-status').textContent = 'Battery: --%';
        }
    });

    window.electronAPI.onBatteryUpdate((data) => {
        const batteryStatusEl = document.getElementById('battery-status');
        batteryStatusEl.textContent = `Battery: ${data.percentage}% ${data.isCharging ? '(Charging ⚡)' : ''}`;
    });

    // DPI Change Listener
    const dpiInputs = document.querySelectorAll('.dpi-row input');
    dpiInputs.forEach((input, index) => {
        input.addEventListener('change', () => {
            window.electronAPI.sendConfig({
                dpi: parseInt(input.value),
                dpiIndex: index
            });
        });
    });

    // Polling Rate Change Listener
    const pollingRateSelect = document.getElementById('polling-rate');
    pollingRateSelect.addEventListener('change', () => {
        window.electronAPI.sendConfig({
            pollingRate: parseInt(pollingRateSelect.value),
            pollingRateIndex: pollingRateSelect.selectedIndex
        });
    });

    // RGB Listeners
    const rgbMode = document.getElementById('rgb-mode');
    const rgbSpeed = document.getElementById('rgb-speed');
    const rgbBrightness = document.getElementById('rgb-brightness');
    const rgbColor = document.getElementById('rgb-color');

    const updateRGB = () => {
        const hex = rgbColor.value;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        window.electronAPI.sendConfig({
            rgb: {
                mode: parseInt(rgbMode.value),
                speed: parseInt(rgbSpeed.value),
                brightness: parseInt(rgbBrightness.value),
                r, g, b
            }
        });
    };

    rgbMode.addEventListener('change', updateRGB);
    rgbSpeed.addEventListener('input', updateRGB);
    rgbBrightness.addEventListener('input', updateRGB);
    rgbColor.addEventListener('input', updateRGB);

    // Performance Listeners
    const lodSelect = document.getElementById('lod-select');
    lodSelect.addEventListener('change', () => {
        window.electronAPI.sendConfig({
            lod: parseInt(lodSelect.value)
        });
    });

    const debounceTime = document.getElementById('debounce-time');
    debounceTime.addEventListener('change', () => {
        // Placeholder for debounce command if different from LOD
    });

    // Profile Listener
    const profileSelect = document.getElementById('profile-select');
    profileSelect.addEventListener('change', async () => {
        const profileId = profileSelect.value;
        await window.electronAPI.setSettings('currentProfileId', profileId);
        // In a real app, this would trigger loading settings for the profile
        // and sending them to the mouse.
    });

    // Button Remapping Listeners
    const buttonSelects = document.querySelectorAll('.button-list select');
    buttonSelects.forEach(select => {
        select.addEventListener('change', () => {
            window.electronAPI.sendConfig({
                button: {
                    index: parseInt(select.getAttribute('data-button-index')),
                    action: parseInt(select.value)
                }
            });
        });
    });

    // Load Initial Settings
    loadSettings();
});

async function loadSettings() {
    const startMinimized = await window.electronAPI.getSettings('settings.startMinimized');
    const autoStart = await window.electronAPI.getSettings('settings.autoStart');

    document.getElementById('start-minimized').checked = startMinimized;
    document.getElementById('auto-start').checked = autoStart;
}

// Event Listeners for Settings
document.getElementById('start-minimized').addEventListener('change', (e) => {
    window.electronAPI.setSettings('settings.startMinimized', e.target.checked);
});

document.getElementById('auto-start').addEventListener('change', (e) => {
    window.electronAPI.setSettings('settings.autoStart', e.target.checked);
});
