var h = require('hyperscript')
var plugs = require('../plugs')
var avatar_name = plugs.first(exports.avatar_name = [])
var avatar_link = plugs.first(exports.avatar_link = [])

exports.message_content = function (msg, sbot)  {
  var c = msg.value.content
  if (c.type === 'pub') {
    var address = c.address || {}
    return [
      h('p', 'announced an address for ',
        avatar_link(address.key, avatar_name(address.key)), ':'),
      h('blockquote',
        h('code', address.host + ':' + address.port)
      )
    ]
  }
}
