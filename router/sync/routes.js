const nest = require('depnest')
const { isBlobLink, isFeed, isMsg } = require('ssb-ref')

exports.gives = nest('router.sync.routes')

exports.needs = nest({
  'app.page': {
    'calendar': 'first',
    'blob': 'first',
    'blogs': 'first',
    'errors': 'first',
    'channel': 'first',
    'imageSearch': 'first',
    'notifications': 'first',
    'posts': 'first',
    'postRank': 'first',
    'private': 'first',
    'profile': 'first',
    'public': 'first',
    'query': 'first',
    'search': 'first',
    'settings': 'first',
    'thankful': 'first',
    'thread': 'first'
  },
  'keys.sync.id': 'first'
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const myId = api.keys.sync.id()
    const pages = api.app.page

    // loc = location
    const routes = [
      [ loc => loc.page === 'blogs', pages.blogs ],
      [ loc => loc.page === 'calendar', pages.calendar ],
      [ loc => loc.page === 'errors', pages.errors ],
      [ loc => loc.page === 'imageSearch', pages.imageSearch ],
      [ loc => loc.page === 'notifications', pages.notifications ],
      [ loc => loc.page === 'posts', pages.posts ],
      [ loc => loc.page === 'postRank', pages.postRank ],
      [ loc => loc.page === 'private', pages.private ],
      [ loc => loc.page === 'public', pages.public ],
      [ loc => loc.page === 'profile', () => pages.profile({ feed: myId }) ],
      [ loc => loc.page === 'query', pages.query ],
      [ loc => loc.page === 'search' && loc.query, pages.search ],
      [ loc => loc.page === 'settings', pages.settings ],
      [ loc => loc.page === 'thankful', pages.thankful ],

      [ loc => loc.blob && isBlobLink(loc.blob), pages.blob ],
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
