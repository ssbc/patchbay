const nest = require('depnest')
const { isBlob, isFeed, isMsg } = require('ssb-ref')

exports.gives = nest('router.sync.routes')

exports.needs = nest({
  'app.page': {
    'errors': 'first',
    'posts': 'first',
    'public': 'first',
    'private': 'first',
    'notifications': 'first',
    'profile': 'first',
    'search': 'first',
    'imageSearch': 'first',
    'blob': 'first',
    'thread': 'first',
    'channel': 'first',
    'settings': 'first'

  },
  'keys.sync.id': 'first'
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const myId = api.keys.sync.id()
    const pages = api.app.page

    // loc = location
    const routes = [
      [ loc => loc.page === 'posts', pages.posts ],
      [ loc => loc.page === 'public', pages.public ],
      [ loc => loc.page === 'private', pages.private ],
      [ loc => loc.page === 'notifications', pages.notifications ],
      [ loc => loc.page === 'errors', pages.errors ],
      [ loc => loc.page === 'profile', () => pages.profile({ feed: myId }) ],
      [ loc => loc.page === 'search' && loc.query, pages.search ],
      [ loc => loc.page === 'imageSearch', pages.imageSearch ],
      [ loc => loc.page === 'settings', pages.settings ],

      [ loc => isBlob(loc.blob), pages.blob ],
      [ loc => isPresent(loc.channel), pages.channel ],
      [ loc => isFeed(loc.feed), pages.profile ],
      [ loc => isMsg(loc.key), pages.thread ]
    ]

    // stack already loaded routes on top of these
    return [...sofar, ...routes]
  })
}

function isPresent (content) {
  return typeof content === 'string' && content.length > 1
}
