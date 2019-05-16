const electron = require('electron')
const defaultMenu = require('electron-default-menu')

module.exports = function StartMenus ({ windows }) {
  const menu = defaultMenu(electron.app, electron.shell)
  const view = menu.find(x => x.label === 'View')
  view.submenu = [
    { role: 'reload' },
    { role: 'toggledevtools' },
    { type: 'separator' },
    { role: 'resetzoom' },
    { role: 'zoomin' },
    { role: 'zoomout' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ]
  const win = menu.find(x => x.label === 'Window')
  win.submenu = [
    { role: 'minimize' },
    { role: 'zoom' },
    { role: 'close', label: 'Close Window', accelerator: 'CmdOrCtrl+Shift+W' },
    { role: 'quit' },
    { type: 'separator' },
    {
      label: 'Close Tab',
      accelerator: 'CmdOrCtrl+W',
      click () {
        windows.ui.webContents.send('closeTab')
      }
    },
    {
      label: 'Select Next Tab',
      accelerator: 'CmdOrCtrl+Shift+]',
      click () {
        windows.ui.webContents.send('nextTab')
      }
    },
    {
      label: 'Select Previous Tab',
      accelerator: 'CmdOrCtrl+Shift+[',
      click () {
        windows.ui.webContents.send('previousTab')
      }
    },
    { type: 'separator' },
    { role: 'front' }
  ]

  const { Menu } = electron
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
}
