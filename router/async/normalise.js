const nest = require('depnest')
const { isBlob, isFeed, isMsg } = require('ssb-ref')

exports.gives = nest('router.async.normalise')

exports.needs = nest({'sbot.async.get': 'first'})

exports.create = (api) => nest('router.async.normalise', normalise)

function normalise (location, cb) {
  if (typeof location === 'object') return location

  if (isMsg(location)) api.sbot.async.get(location, cb)

  if (isBlob(location)) cb(null, { blob: location })
  if (isChannel(location)) cb(null, { channel: location })
  if (isFeed(location)) cb(null, { feed: location })
  if (isPage(location)) cb(null, { page: location.substring(1) })
}

function isChannel (str) {
  return typeof str === 'string' && str[0] === '#' && str.length > 1
}

function isPage (str) {
  return typeof str === 'string' && str[0] === '/' && str.length > 1
}

