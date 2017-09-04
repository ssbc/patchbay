const nest = require('depnest')
const { isBlob, isFeed, isMsg } = require('ssb-ref')

exports.gives = nest('router.sync.routes')

exports.needs = nest({
  'app.page': {
    'errors': 'first',
    'inbox': 'first',
    'public': 'first',
    'private': 'first',
    'notifications': 'first',
    'profile': 'first',
    'search': 'first',
    'blob': 'first',
    'thread': 'first',
    'channel': 'first'
  },
  'keys.sync.id': 'first'
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const myId = api.keys.sync.id()
    const pages = api.app.page

    // loc = location
    const routes = [
      [ loc => loc.page === 'public', pages.public ],
      [ loc => loc.page === 'inbox', pages.inbox ],
      [ loc => loc.page === 'private', pages.private ],
      [ loc => loc.page === 'notifications', pages.notifications ],
      [ loc => loc.page === 'errors', pages.errors ],
      [ loc => loc.page === 'profile', () => pages.profile({ feed: myId }) ],
      [ loc => loc.page === 'search' && loc.query, pages.search ],

      [ loc => isBlob(loc.blob), pages.blob ],
      [ loc => isPresent(loc.channel), pages.channel ],
      [ loc => isFeed(loc.feed), pages.profile ],
      [ loc => isMsg(loc.key), pages.thread ]
    ]

    return [...sofar, ...routes]
  })
}

function isPresent (content) {
  return typeof content === 'string' && content.length > 1
}
