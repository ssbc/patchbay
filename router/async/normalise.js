const nest = require('depnest')
const { isBlobLink, isFeed, isMsg, parseLink } = require('ssb-ref')
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

    var link = parseLink(location)

    if (link && isMsg(link.link)) {
      var params = { id: link.link }
      if (link.query && link.query.unbox) {
        params.private = true
        params.unbox = link.query.unbox
      }
      api.sbot.async.get(params, function (err, value) {
        if (err) cb(err)
        else {
          if (typeof value.content === 'string') value = api.message.sync.unbox(value)
          cb(null, { key: link.link, value })
        }
      })
    } else if (isBlobLink(location)) {
      // handles public & private blobs
      // TODO - parse into link and query?
      cb(null, { blob: location })
    } else if (isChannelMulti(location)) cb(null, { channels: location.split('+') })
    else if (isChannel(location)) cb(null, { channel: location })
    else if (isFeed(location)) cb(null, { feed: location })
    else if (isPage(location)) cb(null, { page: location.substring(1) })
    else if (isSearch(location)) cb(null, { page: 'search', query: location.substring(1) })

    return true
  }
}

function isChannelMulti (str) {
  if (typeof str !== 'string') return false

  const channels = str.split('+')
  return channels.length > 1 && channels.every(isChannel)
}

function isChannel (str) {
  return typeof str === 'string' && str[0] === '#' && str.length > 1
}

function isPage (str) {
  return typeof str === 'string' && str[0] === '/' && str.length > 1
}

function isSearch (str) {
  return typeof str === 'string' && str[0] === '?' && str.length > 1
}
