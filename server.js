const electron = require('electron')
const Client = require('ssb-client')
const scuttleshell = require('scuttle-shell')

// Get config options from depject
const config = require('./config').create().config.sync.load()

// Check if scuttle-shell is already running
// TODO - make this check for scuttle-shell specifically (and not just an sbot)
Client(config.keys, config, (err, server) => {
  // err implies no server currently running
  if (err) {
    console.warn('client connection failed:', err)
    console.log('> starting scuttle-shell')
    scuttleshell.start({}, (startErr) => {
	  console.log('start done!', startErr)
      if (startErr) {
        console.error('failed to start scuttle-shell:', startErr)
      } else {
        electron.ipcRenderer.send('server-started')
      }
    })
  } else {
    console.log('> scuttle-shell / sbot already running')
    server.close() // close this connection (app starts one of its own)
    electron.ipcRenderer.send('server-started')
  }
})
