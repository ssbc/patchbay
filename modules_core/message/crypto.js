var ref = require('ssb-ref')
var keys = require('../../keys')
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


exports.needs = {
  sbot: { publish: 'first' }
}

exports.gives = {
  message: {
    unbox: true,
    box: true,
    publish: true
  }
}

exports.create = function (api) {
  return {
    message: {
      unbox,
      box,
      publish
    }
  }

  function unbox (msg) {
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

  function box (content) {
    return ssbKeys.box(content, content.recps.map(function (e) {
      return ref.isFeed(e) ? e : e.link
    }))
  }

  function publish (content, cb) {
    if(content.recps)
      content = box(content)
    api.sbot.publish(content, function (err, msg) {
      if(err) throw err
      console.log('PUBLISHED', msg)
      if(cb) cb(err, msg)
    })
  }
}

