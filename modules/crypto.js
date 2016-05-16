
var path = require('path')
var ssbKeys = require('ssb-keys')
var config = require('ssb-config/inject')(process.env.ssb_appname)
var keys = ssbKeys
  .loadSync(path.join(config.path, 'secret'))

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

exports.message_meta = function (msg) {
  if(msg.value.private)
    return "PRIVATE"
}
