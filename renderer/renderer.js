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
    window.electronAPI.onDeviceStatus((status) => {
        const deviceNameEl = document.getElementById('device-name');
        if (status.type === 'discovery' && status.devices.length > 0) {
            deviceNameEl.textContent = status.devices[0].productName || 'Keychron Mouse';
        } else if (status.type === 'disconnected') {
            deviceNameEl.textContent = 'No Device Connected';
            document.getElementById('battery-status').textContent = 'Battery: --%';
        }
    });

    window.electronAPI.onBatteryUpdate((data) => {
        const batteryStatusEl = document.getElementById('battery-status');
        batteryStatusEl.textContent = `Battery: ${data.percentage}% ${data.isCharging ? '⚡' : ''}`;
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

    /**
     * FUTURE: Add listeners for Button Mapping, RGB, and Profiles.
     *
     * Example for RGB:
     * document.querySelector('#lighting-tab select').addEventListener('change', (e) => {
     *     window.electronAPI.sendConfig({ rgbMode: e.target.selectedIndex });
     * });
     */

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
