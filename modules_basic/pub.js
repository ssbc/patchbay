var h = require('hyperscript')

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
