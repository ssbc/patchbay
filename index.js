const ahoy = require('ssb-ahoy')
const electron = require('electron')
const defaultMenu = require('electron-default-menu')

const config = require('./config').create().config.sync.load()

const plugins = [
  'ssb-server/plugins/master',
  'ssb-server/plugins/logging',
  'ssb-server/plugins/unix-socket',
  'ssb-server/plugins/no-auth',
  'ssb-server/plugins/onion',
  'ssb-server/plugins/local',

  'ssb-legacy-conn',
  'ssb-replicate',
  'ssb-friends',
  'ssb-invite',

  'ssb-blobs',
  'ssb-ws',

  'ssb-about',
  'ssb-backlinks',
  'ssb-chess-db',
  'ssb-ebt',
  'ssb-friend-pub',
  'ssb-meme',
  'ssb-private',
  'ssb-query',
  'ssb-search',
  'ssb-suggest',
  'ssb-unread'
]

ahoy(
  {
    title: 'Patchbay',
    config,
    plugins,
    uiPath: './main.js',
    // appDir: '../patchbay' // uncomment when ssb-ahoy is symlinked in!
  },
  (state) => {
    StartMenus(state)
  }
)

function StartMenus ({ windows }) {
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
