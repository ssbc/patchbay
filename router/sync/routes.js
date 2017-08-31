const nest = require('depnest')
const { isBlob, isFeed, isMsg } = require('ssb-ref')

exports.gives = nest('router.sync.routes')

exports.needs = nest({
  'app.page': {
    'errors': 'first',
    'public': 'first',
    'private': 'first',
    'notifications': 'first',
    'profile': 'first',
    'blob': 'first',
    'thread': 'first',
    'channel': 'first'
  },
  'keys.sync.id': 'first',
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const myId = api.keys.sync.id()
    const {
      errors, public, private, notifications, channel,
      profile, blob, thread
    } = api.app.page

    // loc = location
    const routes = [
      [ loc => loc.page === 'public', public ],
      [ loc => loc.page === 'private', private ],
      [ loc => loc.page === 'notifications', notifications ],
      [ loc => loc.page === 'errors', errors ],
      [ loc => loc.page === 'profile', () => profile({ id: myId }) ],

      // TODO - use is-my-json-valid ?
      [ loc => isBlob(loc.blob), blob ],
      [ loc => isPresent(loc.channel), channel ],
      [ loc => isFeed(loc.feed), profile ],
      [ loc => isMsg(loc.key), thread ]
    ]

    return [...sofar, ...routes]
  })
}

function isPresent (content) {
  return typeof content === 'string' && content.length > 1
}

