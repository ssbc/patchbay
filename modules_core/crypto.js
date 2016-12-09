var ref = require('ssb-ref')
var keys = require('../keys')
var ssbKeys = require('ssb-keys')

function unbox_value(msg) {
  var plaintext = ssbKeys.unbox(msg.content, keys)
  if(!plaintext) return null
  return {
    previous: msg.previous,
    author: msg.author,
    sequence: msg.sequence,
    timestamp: msg.timestamp,
    hash: msg.hash,
    content: plaintext,
    private: true
  }
}


module.exports = {

  needs: {sbot_publish: 'first'},
  gives: {
    message_unbox: true, message_box: true, publish: true
  },
  create: function (api) {

    var exports = {}
    exports.message_unbox = function (msg) {
      if(msg.value) {
        var value = unbox_value(msg.value)
        if(value)
        return {
          key: msg.key, value: value, timestamp: msg.timestamp
        }
      }
      else
        return unbox_value(msg)
    }

    exports.message_box = function (content) {
      return ssbKeys.box(content, content.recps.map(function (e) {
        return ref.isFeed(e) ? e : e.link
      }))
    }

    exports.publish = function (content, cb) {
      if(content.recps)
        content = exports.message_box(content)
      api.sbot_publish(content, function (err, msg) {
        if(err) throw err
        console.log('PUBLISHED', msg)
        if(cb) cb(err, msg)
      })
    }

    return exports
  }
}

