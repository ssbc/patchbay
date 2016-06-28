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
var createClient = require('ssb-client')

module.exports = function () {
  var sbot = null
  var rec = Reconnect(function (isConn) {
    console.log("RECONNECT", isConn)
    createClient(function (err, _sbot) {
      if(err) {console.error(err.stack); isConn(err)}
      sbot = _sbot
      sbot.on('closed', function () {
        console.log("DISCONNECT")
        sbot = null
        isConn(new Error('closed'))
      })
      isConn()
    })
  })

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
      sbot.publish(msg, cb)
    }),
    sbot_whoami: rec.async(function (cb) {
      sbot.whoami(cb)
    })
  }
}


