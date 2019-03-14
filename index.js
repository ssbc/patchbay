var defaultMenu = require('electron-default-menu')
var WindowState = require('electron-window-state')
var electron = require('electron')
var Menu = electron.Menu
var Path = require('path')

var state = {
  windows: {},
  quitting: false
}

console.log('STARTING patchbay')
electron.app.on('ready', () => {
  startMenus()

  startBackgroundProcess()
  // wait until server has started before opening main window
  electron.ipcMain.once('server-started', function (ev, config) {
    openMainWindow()
  })

  electron.app.on('before-quit', function () {
    state.quitting = true
  })

  electron.app.on('activate', function (e) {
    // reopen the app when dock icon clicked on macOS
    if (state.windows.main) {
      state.windows.main.show()
    }
  })

  // allow inspecting of background process
  electron.ipcMain.on('open-background-devtools', function (ev, config) {
    if (state.windows.background) {
      state.windows.background.webContents.openDevTools({ detach: true })
    }
  })
})

function startBackgroundProcess () {
  if (state.windows.background) return

  state.windows.background = openWindow(Path.join(__dirname, 'server.js'), {
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
  if (state.windows.main) return

  var windowState = WindowState({
    defaultWidth: 1024,
    defaultHeight: 768
  })
  state.windows.main = openWindow(Path.join(__dirname, 'main.js'), {
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
  windowState.manage(state.windows.main)
  state.windows.main.setSheetOffset(40)
  state.windows.main.on('close', function (e) {
    if (!state.quitting && process.platform === 'darwin') {
      e.preventDefault()
      state.windows.main.hide()
    }
  })
  state.windows.main.on('closed', function () {
    state.windows.main = null
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

function startMenus () {
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
        state.windows.main.webContents.send('closeTab')
      }
    },
    {
      label: 'Select Next Tab',
      accelerator: 'CmdOrCtrl+Shift+]',
      click () {
        state.windows.main.webContents.send('nextTab')
      }
    },
    {
      label: 'Select Previous Tab',
      accelerator: 'CmdOrCtrl+Shift+[',
      click () {
        state.windows.main.webContents.send('previousTab')
      }
    },
    { type: 'separator' },
    { role: 'front' }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
}
