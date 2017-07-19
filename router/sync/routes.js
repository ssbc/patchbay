const nest = require('depnest')

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

    const routes = [
      [ ({ page }) => page === '/public', public ],
      [ ({ page }) => page === '/private', private ],
      [ ({ page }) => page === '/notifications', notifications ],
      [ ({ page }) => page === '/errors', errors ],
      [ ({ page }) => page === '/profile', () => profile({ id: myId }) ],
      // TODO - use is-my-json-valid ?
      [ ({ blob }) => isPresent(blob), blob ],
      [ ({ channel }) => isPresent(channel), channel ],
      [ ({ feed }) => isPresent(feed), profile ],
      [ ({ msg }) => isPresent(msg), thread ]
    ]

    return [...sofar, ...routes]
  })
}

function isPresent (content) {
  return typeof content === 'string' && content.length > 1
}



