const Store = require('electron-store');

const schema = {
  profiles: {
    type: 'array',
    default: [
      {
        id: 'default',
        name: 'Default Profile',
        dpi: 800,
        pollingRate: 1000,
        rgbMode: 0,
        buttons: [
          { id: 1, action: 'left_click' },
          { id: 2, action: 'right_click' },
          { id: 3, action: 'middle_click' },
          { id: 4, action: 'back' },
          { id: 5, action: 'forward' }
        ]
      }
    ]
  },
  currentProfileId: {
    type: 'string',
    default: 'default'
  },
  settings: {
    type: 'object',
    default: {
      startMinimized: false,
      autoStart: true
    }
  }
};

const store = new Store({ schema });

module.exports = store;
