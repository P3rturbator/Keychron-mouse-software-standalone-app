# Keychron M-Series HID Protocol Documentation

This document outlines the HID communication structure for Keychron M-series mice and provides guidance on how to implement additional features.

## Device Identifiers
- **Vendor ID (VID):** `0x3434` (Keychron)
- **Product IDs (PID):**
  - M3 Wired: `0x0111`
  - M3 Wireless (2.4G): `0x0112`
  - M3 Bluetooth: `0x0113`
  - Note: Other M-series models (M1, M2, etc.) use similar sequences.

## HID Communication Details
- **Report Size:** 64 bytes (padded with zeros).
- **Interface:** Vendor-specific interface (usually Interface 1 or 2).
- **Usage Page:** `0xFF00`
- **Usage:** `0x01`

## Implemented Commands

### 1. Get Battery Level
- **Request:** `[0x07, 0x02, ...]`
- **Response:** `[0x07, 0x02, battery_level, charging_state, ...]`
  - `battery_level`: 0-100 (percentage)
  - `charging_state`: `0x01` if charging, `0x00` otherwise.

### 2. Set DPI
- **Request:** `[0x07, 0x03, dpi_index, high_byte, low_byte, ...]`
  - `dpi_index`: The DPI stage index (0-4).
  - `high_byte`, `low_byte`: 16-bit DPI value.

### 3. Set Polling Rate
- **Request:** `[0x07, 0x04, rate_index, ...]`
  - `rate_index`: `0` (125Hz), `1` (250Hz), `2` (500Hz), `3` (1000Hz).

---

## Future Implementation Guide

To add support for remaining features, identify the correct HID report IDs and byte offsets, then update the following files:

### Button Remapping
1. **HID Command:** Typically involves sending a report with an array of button function codes.
2. **Logic Location:** Add a handler in `main/hid.js`'s `sendConfig` method or a new `sendButtonMapping` method.
3. **UI Integration:** Update `renderer/renderer.js` to capture button selections and invoke the IPC handler.

### RGB Lighting
1. **HID Command:** Requires a report containing the effect ID, speed, brightness, and RGB colors.
2. **Logic Location:** Implement in `main/hid.js`.
3. **UI Integration:** Add event listeners to the lighting tab in `renderer/renderer.js`.

### Profile Management
1. **Logic Location:** Profiles are currently stored in `main/store.js`. Switching profiles should trigger a full configuration sync (`sendConfig` for all stored settings) to the mouse.
2. **UI Integration:** Add a profile selector in the sidebar or settings tab.

### Discovery of New Commands
Use tools like Wireshark with USBPcap or specialized HID sniffers while using the official Keychron WebUI to capture and reverse-engineer the 64-byte packets for specific actions.
