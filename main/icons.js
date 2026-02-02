const { nativeImage } = require('electron');

// Simple 16x16 colored squares for battery levels
const icons = {
  // Blue square with white-ish center for charging
  charging: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAW0lEQVR42mP8z8AARCAWAsQsQMwExEBMD6AGMM6AAYhZgJgJiIGYHkANEMyAAIgZgJgZiIGYHkANEMyAAIidgJgZiIGYHkANEMyAAIgZgJgZiIGYHkANEMyAAAEEAARSAZ2H4Y73AAAAAElFTkSuQmCC', // Red placeholder, let me change colors

  // Green (Full)
  full: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAY0lEQVR42mP8z8AARCAWAsQsQMwExEBMD6AGMM6AAYhZgJgJiIGYHkANEMyAAIgZgJgZiIGYHkANEMyAAIidgJgZiIGYHkANEMyAAIgZgJgZiIGYHkANEMyAAAEEAARSAZ2H4Y73AAAAAElFTkSuQmCC', // I need real colored base64
};

// I'll create a helper to generate a solid color icon buffer
function createSolidColorIcon(r, g, b) {
    const size = 16;
    const buffer = Buffer.alloc(size * size * 4);
    for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = b;     // Blue
        buffer[i + 1] = g; // Green
        buffer[i + 2] = r; // Red
        buffer[i + 3] = 255; // Alpha
    }
    return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

function getBatteryIcon(percentage, isCharging) {
  if (isCharging) return createSolidColorIcon(0, 120, 212); // Blue
  if (percentage <= 10) return createSolidColorIcon(232, 17, 35); // Red
  if (percentage <= 30) return createSolidColorIcon(202, 80, 16); // Orange
  if (percentage <= 60) return createSolidColorIcon(255, 185, 0); // Yellow
  if (percentage <= 90) return createSolidColorIcon(127, 186, 0); // Light Green
  return createSolidColorIcon(0, 158, 73); // Dark Green
}

module.exports = { getBatteryIcon };
