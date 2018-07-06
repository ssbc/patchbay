const electron = require('electron')
const Client = require('ssb-client')
const { spawn } = require('child_process')

// Get config options from depject
const config = require('./config').create().config.sync.load()

// Check if scuttle-shell is already running
// TODO - make this check for scuttle-shell specifically (and not just an sbot)

Client(config.keys, config, (err, server) => {
  // err implies no server currently running
  if (err) startShell()
  else {
    console.log('> scuttle-shell / sbot already running')
    server.close() // close this connection (app starts one of its own)
  }

  electron.ipcRenderer.send('server-started')
})

function startShell () {
  console.log('> starting scuttle-shell')

  spawn(`scuttleshell`, {
    detached: true
  })
}

// const createSbot = require('scuttlebot')
//   .use(require('scuttlebot/plugins/master'))
//   .use(require('scuttlebot/plugins/gossip'))
//   .use(require('scuttlebot/plugins/replicate'))
//   .use(require('scuttlebot/plugins/invite'))
//   .use(require('scuttlebot/plugins/local'))
//   .use(require('scuttlebot/plugins/logging'))
//   .use(require('ssb-about'))
//   .use(require('ssb-backlinks'))
//   .use(require('ssb-blobs'))
//   .use(require('ssb-chess-db'))
//   .use(require('ssb-ebt'))
//   .use(require('ssb-friends'))
//   .use(require('ssb-meme'))
//   .use(require('ssb-private'))
//   .use(require('ssb-query'))
//   .use(require('ssb-search'))
//   .use(require('ssb-ws'))
//   // .use(require('ssb-mutual')) // this is has recursion problems atm

// const sbot = createSbot(config)
