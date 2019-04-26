const ahoy = require('ssb-ahoy')
const StartMenus = require('./menu')

const config = require('./config').create().config.sync.load()

const plugins = [
  'ssb-server/plugins/master',
  'ssb-server/plugins/logging',
  'ssb-server/plugins/unix-socket',
  'ssb-server/plugins/no-auth',
  'ssb-server/plugins/onion',
  'ssb-server/plugins/local',

  'ssb-legacy-conn',
  'ssb-replicate',
  'ssb-friends',
  'ssb-invite',

  'ssb-blobs',
  'ssb-ws',

  'ssb-about',
  'ssb-backlinks',
  'ssb-chess-db',
  'ssb-ebt',
  'ssb-friend-pub',
  'ssb-meme',
  'ssb-private',
  'ssb-query',
  'ssb-search',
  'ssb-suggest',
  'ssb-unread'
]

ahoy(
  {
    title: 'Patchbay',
    config,
    plugins,
    // appDir: '../patchbay', // uncomment when ssb-ahoy is symlinked in!
    uiPath: './ui.js'
  },
  (state) => {
    StartMenus(state)
  }
)
