// formerly background-process.js
var fs = require('fs')
var Path = require('path')
var electron = require('electron')

console.log('STARTING SBOT')

var createSbot = require('ssb-server')
  .use(require('ssb-server/plugins/master'))
  .use(require('ssb-server/plugins/gossip'))
  .use(require('ssb-server/plugins/replicate'))
  .use(require('ssb-server/plugins/invite'))
  .use(require('ssb-server/plugins/local'))
  .use(require('ssb-server/plugins/logging'))
  .use(require('ssb-server/plugins/unix-socket'))
  .use(require('ssb-server/plugins/no-auth'))
  .use(require('ssb-server/plugins/onion'))
  .use(require('ssb-about'))
  .use(require('ssb-backlinks'))
  .use(require('ssb-blobs'))
  .use(require('ssb-chess-db'))
  .use(require('ssb-ebt'))
  .use(require('ssb-friends'))
  .use(require('ssb-friend-pub'))
  .use(require('ssb-meme'))
  .use(require('ssb-private'))
  .use(require('ssb-query'))
  .use(require('ssb-search'))
  .use(require('ssb-unread'))
  .use(require('ssb-ws'))
  // .use(require('ssb-mutual')) // this is has recursion problems atm

// pull config options out of depject
var config = require('./config').create().config.sync.load()

var sbot = createSbot(config)
var manifest = sbot.getManifest()
fs.writeFileSync(Path.join(config.path, 'manifest.json'), JSON.stringify(manifest))
electron.ipcRenderer.send('server-started')
