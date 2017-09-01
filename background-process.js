var fs = require('fs')
var Path = require('path')
var electron = require('electron')

console.log('STARTING SBOT')

var createSbot = require('scuttlebot')
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/gossip'))
  .use(require('scuttlebot/plugins/replicate'))
  .use(require('ssb-friends'))
  .use(require('ssb-blobs'))
  .use(require('ssb-backlinks'))
  .use(require('ssb-private'))
  .use(require('scuttlebot/plugins/invite'))
  .use(require('scuttlebot/plugins/local'))
  .use(require('scuttlebot/plugins/logging'))
  .use(require('ssb-query'))
  .use(require('ssb-about'))
  .use(require('ssb-contacts'))
  .use(require('ssb-fulltext'))
  // .use(require('ssb-ebt'))
  .use(require('ssb-ws'))

// pull config options out of depject
var config = require('./config').create().config.sync.load()

var sbot = createSbot(config)
var manifest = sbot.getManifest()
fs.writeFileSync(Path.join(config.path, 'manifest.json'), JSON.stringify(manifest))
electron.ipcRenderer.send('server-started')

