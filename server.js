// formerly background-process.js
var fs = require('fs')
var Path = require('path')

console.log('STARTING SBOT')

var createSbot = require('scuttlebot')
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/gossip'))
  .use(require('scuttlebot/plugins/replicate'))
  .use(require('scuttlebot/plugins/invite'))
  .use(require('scuttlebot/plugins/local'))
  .use(require('scuttlebot/plugins/logging'))
  .use(require('scuttlebot/plugins/unix-socket'))
  .use(require('scuttlebot/plugins/no-auth'))
  .use(require('ssb-about'))
  .use(require('ssb-backlinks'))
  .use(require('ssb-blobs'))
  .use(require('ssb-chess-db'))
  .use(require('ssb-ebt'))
  .use(require('ssb-friends'))
  .use(require('ssb-meme'))
  .use(require('ssb-private'))
  .use(require('ssb-query'))
  .use(require('ssb-search'))
  .use(require('ssb-unread'))
  .use(require('ssb-ws'))
  .use(require('ssb-blob-content'))
  // .use(require('ssb-mutual')) // this is has recursion problems atm

// pull config options out of depject
var config = require('./config').create().config.sync.load()

var sbot = createSbot(config)
var manifest = sbot.getManifest()
fs.writeFileSync(Path.join(config.path, 'manifest.json'), JSON.stringify(manifest))

module.exports = (cb) => cb()
