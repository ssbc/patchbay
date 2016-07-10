var pull = require('pull-stream')
var crypto = require('crypto')
var Reconnect = require('pull-reconnect')

function Hash (onHash) {
  var hash = crypto.createHash('sha256')
  return pull.through(function (data) {
    hash.update(
        'string' === typeof data
      ? new Buffer(data, 'utf8')
      : data
    )
  }, function (err) {
    if(err && !onHash) throw err
    onHash && onHash(err, '&'+hash.digest('base64')+'.sha256')
  })
}
//uncomment this to use from browser...
//also depends on having ssb-ws installed.
//var createClient = require('ssb-lite')
var createClient = require('ssb-client')

var createConfig = require('ssb-config/inject')

var createFeed   = require('ssb-feed')
var keys = require('./keys')


module.exports = function () {
  var opts = createConfig()
  var sbot = null

  var rec = Reconnect(function (isConn) {
    var remote
    if('undefined' !== typeof localStorage)
      remote = localStorage.remote

    createClient(keys, {
      manifest: require('./manifest.json'),
      remote: remote
    }, function (err, _sbot) {
      if(err) {
        console.error(err.stack)
        isConn(err)
        return
      }
      sbot = _sbot
      sbot.on('closed', function () {
        sbot = null
        isConn(new Error('closed'))
      })
      isConn()
    })
  })

  var internal = {
    getLatest: rec.async(function (id, cb) {
      sbot.getLatest(id, cb)
    }),
    add: rec.async(function (msg, cb) {
      sbot.add(msg, cb)
    })
  }

  var feed = createFeed(internal, keys)

  return {
    sbot_blobs_add: rec.sink(function (cb) {
      return pull(
        Hash(cb),
        sbot.blobs.add()
      )
    }),
    sbot_links: rec.source(function (query) {
      return sbot.links(query)
    }),
    sbot_links2: rec.source(function (query) {
      return sbot.links2.read(query)
    }),
    sbot_query: rec.source(function (query) {
      return sbot.query.read(query)
    }),
    sbot_log: rec.source(function (opts) {
      return sbot.createLogStream(opts)
    }),
    sbot_user_feed: rec.source(function (opts) {
      return sbot.createUserStream(opts)
    }),
    sbot_get: rec.async(function (key, cb) {
      sbot.get(key, cb)
    }),
    sbot_publish: rec.async(function (msg, cb) {
      feed.add(msg, function (err, msg) {
        cb(err, msg)
      })
    }),
    sbot_whoami: rec.async(function (cb) {
      sbot.whoami(cb)
    })
  }
}


