var h = require('hyperscript')
//var plugs = require('../plugs')
//var avatar_name = plugs.first(exports.avatar_name = [])
//var avatar_link = plugs.first(exports.avatar_link = [])
//
exports.needs = {
  avatar_name: 'first',
  avatar_link: 'first'
}

exports.gives = 'message_content'

exports.create = function (api) {

  return function (msg, sbot)  {
    var c = msg.value.content
    if (c.type === 'pub') {
      var address = c.address || {}
      return [
        h('p', 'announced an address for ',
          api.avatar_link(address.key, api.avatar_name(address.key)), ':'),
        h('blockquote',
          h('code', address.host + ':' + address.port)
        )
      ]
    }
  }

}
