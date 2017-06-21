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

    const routes = [
      ['/errors',        () => errors()],
      ['/public',        () => public()],
      ['/private',       () => private()],
      ['/notifications', () => notifications()],
      ['/profile',       () => profile({ id: myId })],
      ['/:key', (params) => {
        const { key } = params
        if (isFeed(key))    return profile(params)
        if (isBlob(key))    return blob(params)
        if (isMsg(key))     return thread(params)
        if (isChannel(key)) return channel(params)
      }]
    ]

    return [...sofar, ...routes]
  })
}

function isChannel (str) {
  typeof str === 'string' && str[0] === '#' && str.length > 1
}

