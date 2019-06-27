const ahoy = require('ssb-ahoy')
const StartMenus = require('./menu')

const plugins = [
  'ssb-master',
  'ssb-unix-socket',
  'ssb-no-auth',
  'ssb-onion',
  'ssb-local',
  'ssb-logging',

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
  'ssb-tangle',
  'ssb-unread'
]

ahoy(
  {
    title: 'Patchbay',
    plugins,
    // appDir: '../patchbay', // only used when ssb-ahoy is symlinked in!
    uiPath: './ui.js'
  },
  (state) => {
    StartMenus(state)
  }
)
