const ahoy = require('ssb-ahoy')

const config = require('./config').create().config.sync.load()

const plugins = [
  'ssb-server/plugins/unix-socket',
  'ssb-server/plugins/no-auth',
  'ssb-about',
  'ssb-backlinks',
  'ssb-private',
  'ssb-query',
  'ssb-suggest',

  'ssb-chess-db',
  'ssb-invite',
  'ssb-friend-pub',
  'ssb-meme',
  'ssb-search'
]

ahoy({ config, plugins, appPath: __dirname })
