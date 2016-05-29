var pull = require('pull-stream')
var crypto = require('crypto')

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


module.exports = function (sbot) {

  return {
    sbot_blobs_add: function (cb) {
      return pull(
        Hash(cb),
        sbot.blobs.add()
      )
    },
    sbot_links: function (query) {
      return sbot.links(query)
    },
    sbot_links2: function (query) {
      return sbot.links2.read(query)
    },
    sbot_log: function (opts) {
      return sbot.createLogStream(opts)
    },
    sbot_user_feed: function (opts) {
      return sbot.createUserStream(opts)
    },
    sbot_get: function (key, cb) {
      sbot.get(key, cb)
    },
    sbot_publish: function (msg, cb) {
      sbot.publish(msg, cb)
    },
    sbot_whoami: function (cb) {
      sbot.whoami(cb)
    }
  }
}



