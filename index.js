var defaultMenu = require('electron-default-menu')
var WindowState = require('electron-window-state')
var electron = require('electron')
var Menu = electron.Menu
var Path = require('path')

var windows = {}
var quitting = false

console.log('STARTING electron')

electron.app.on('ready', () => {
  // set up menus
  var menu = defaultMenu(electron.app, electron.shell)
  var view = menu.find(x => x.label === 'View')
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
  var win = menu.find(x => x.label === 'Window')
  win.submenu = [
    { role: 'minimize' },
    { role: 'zoom' },
    { role: 'close', label: 'Close Window', accelerator: 'CmdOrCtrl+Shift+W' },
    { type: 'separator' },
    {
      label: 'Close Tab',
      accelerator: 'CmdOrCtrl+W',
      click () {
        windows.main.webContents.send('closeTab')
      }
    },
    {
      label: 'Select Next Tab',
      accelerator: 'CmdOrCtrl+Shift+]',
      click () {
        windows.main.webContents.send('nextTab')
      }
    },
    {
      label: 'Select Previous Tab',
      accelerator: 'CmdOrCtrl+Shift+[',
      click () {
        windows.main.webContents.send('previousTab')
      }
    },
    { type: 'separator' },
    { role: 'front' }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))

  startBackgroundProcess()

  // wait until server has started before opening main window
  electron.ipcMain.once('server-started', function (ev, config) {
    openMainWindow()
  })

  electron.app.on('before-quit', function () {
    quitting = true
  })

  // allow inspecting of background process
  electron.ipcMain.on('open-background-devtools', function (ev, config) {
    if (windows.background) {
      windows.background.webContents.openDevTools({ detach: true })
    }
  })
})

function startBackgroundProcess () {
  if (windows.background) return

  windows.background = openWindow(Path.join(__dirname, 'server.js'), {
    title: 'patchbay-server',
    show: false,
    connect: false,
    width: 150,
    height: 150,
    center: true,
    fullscreen: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    skipTaskbar: true,
    useContentSize: true
  })
}

function openMainWindow () {
  if (windows.main) return

  var windowState = WindowState({
    defaultWidth: 1024,
    defaultHeight: 768
  })
  windows.main = openWindow(Path.join(__dirname, 'main.js'), {
    title: 'Patchbay',
    show: true,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    width: windowState.width,
    height: windowState.height,
    autoHideMenuBar: true,
    frame: !process.env.FRAME,
    // titleBarStyle: 'hidden',
    backgroundColor: '#FFF',
    icon: './assets/icon.png'
  })
  windowState.manage(windows.main)
  windows.main.setSheetOffset(40)
  windows.main.on('close', function (e) {
    if (!quitting && process.platform === 'darwin') {
      e.preventDefault()
      windows.main.hide()
    }
  })
  windows.main.on('closed', function () {
    windows.main = null
    if (process.platform !== 'darwin') electron.app.quit()
  })
}

function openWindow (path, opts) {
  var window = new electron.BrowserWindow(opts)

  window.webContents.on('dom-ready', function () {
    window.webContents.executeJavaScript(`
      var electron = require('electron')
      var h = require('mutant/h')
      electron.webFrame.setVisualZoomLevelLimits(1, 1)
      var title = ${JSON.stringify(opts.title || 'Patchbay')}
      document.documentElement.querySelector('head').appendChild(
        h('title', title)
      )
      require(${JSON.stringify(path)})
    `) // NOTE tried process(electron)
  })

  window.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  window.webContents.on('new-window', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  window.loadURL('file://' + Path.join(__dirname, 'assets', 'base.html'))
  return window
}
