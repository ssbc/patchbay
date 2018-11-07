const Client = require('ssb-client')
const scuttleshell = require('scuttle-shell')
const electron = require('electron')

// Get config options from depject
const config = require('./config').create().config.sync.load()

Client(config.keys, config, (err, server) => {
  if (err) { // no server currently running
    console.log('> scuttle-shell: starting')
    scuttleshell.start({}, (startErr) => {
      if (startErr) return console.error('> scuttle-shell: failed to start', startErr)

      electron.ipcRenderer.send('server-started')
    })
  } else {
    console.log('> scuttle-shell / sbot already running')
    electron.ipcRenderer.send('server-started')
    server.close() // close this connection (app starts one of its own)
  }
})
