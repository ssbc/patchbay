const fs = require('fs')
const { join } = require('path')
const Client = require('ssb-client')
const scuttleshell = require('scuttle-shell')
const electron = require('electron')

// Get config options from depject
const config = require('./config').create().config.sync.load()

// check if manifest.json exists (has any sbot ever started?)
if (!fs.existsSync(join(config.path, 'manifest.json'))) startScuttleShell()
else {
  // check if there's a server running we can connect to
  Client(config.keys, config, (err, server) => {
    if (err) startScuttleShell()
    else {
      console.log('> scuttle-shell / sbot already running')
      server.close() // close this connection (app starts one of its own)

      startFrontend()
    }
  })
}

// helpers

function startScuttleShell () {
  console.log('> scuttle-shell: starting')

  scuttleshell.start({}, (startErr) => {
    if (startErr) return console.error('> scuttle-shell: failed to start', startErr)

    startFrontend()
  })
}

function startFrontend () {
  electron.ipcRenderer.send('server-started')
}
