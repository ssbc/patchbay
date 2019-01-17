const nest = require('depnest')
const { isBlobLink, isFeed, isMsg } = require('ssb-ref')
const ssbUri = require('ssb-uri')

exports.gives = nest('router.async.normalise')

exports.needs = nest({
  'message.sync.unbox': 'first',
  'sbot.async.get': 'first'
})

exports.create = (api) => {
  return nest('router.async.normalise', normalise)

  function normalise (location, cb) {
    if (typeof location === 'object') {
      cb(null, location)
      return true
    }

    // if someone has given you an annoying html encoded location
    if (location.match(/^%25.*%3D.sha256$/)) {
      location = decodeURIComponent(location)
    }

    if (location.startsWith('ssb:')) {
      try {
        location = ssbUri.toSigilLink(location)
      } catch (err) {
        cb(err)
      }
    }

    if (isMsg(location)) {
      api.sbot.async.get(location, (err, value) => {
        if (err) cb(err)
        else {
          if (typeof value.content === 'string') value = api.message.sync.unbox(value)
          cb(null, { key: location, value })
        }
      })
    } else if (isBlobLink(location)) {
      // handles public & private blobs
      // TODO - parse into link and query?
      cb(null, { blob: location })
    } else if (isChannel(location)) cb(null, { channel: location })
    else if (isFeed(location)) cb(null, { feed: location })
    else if (isPage(location)) cb(null, { page: location.substring(1) })

    return true
  }
}

function isChannel (str) {
  return typeof str === 'string' && str[0] === '#' && str.length > 1
}

function isPage (str) {
  return typeof str === 'string' && str[0] === '/' && str.length > 1
}
