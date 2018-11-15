const electron = require('electron')
const Client = require('ssb-client')
const scuttleshell = require('scuttle-shell')

// Get config options from depject
const config = require('./config').create().config.sync.load()
const startFrontend = () => electron.ipcRenderer.send('server-started')

// Check if scuttle-shell is already running
// TODO - make this check for scuttle-shell specifically (and not just an sbot)
Client(config.keys, config, (err, server) => {
  // err implies no server currently running
  if (err) {
    console.warn('client connection failed:', err)
    console.log('> starting scuttle-shell')
    scuttleshell.start({}, (startErr) => {
      if (startErr) return console.error('> scuttle-shell: failed to start', startErr)

      startFrontend()
    })
  } else {
    console.log('> scuttle-shell / sbot already running')
    server.close() // close this connection (app starts one of its own)

    startFrontend()
  }
})
