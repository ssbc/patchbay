const nest = require('depnest')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'app.async.catchLinkClick': 'first',
  'app.sync.catchKeyboardShortcut': 'first',
  'app.html.tabs': 'first',
})


exports.create = function (api) {
  return nest('app.sync.initialise', userActionListeners)

  function userActionListeners (App) {
    const tabs = api.app.html.tabs()

    api.app.sync.catchKeyboardShortcut(window)
    api.app.async.catchLinkClick(App)

    electron.ipcRenderer.on('nextTab', () => {
      tabs.nextTab()
    })

    electron.ipcRenderer.on('previousTab', () => {
      tabs.previousTab()
    })

    electron.ipcRenderer.on('closeTab', () => {
      tabs.closeCurrentTab()
    })

  }
}

