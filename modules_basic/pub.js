var h = require('hyperscript')

exports.needs = {
  avatar_name: 'first',
  avatar_link: 'first'
}

exports.gives = 'message_content_mini'

exports.create = function (api) {

  return function (msg, sbot)  {
    var c = msg.value.content
    if (c.type === 'pub') {
      var address = c.address || c.pub || {}
      var pubId = address.key || address.link
      return [
        'connects to ',
        api.avatar_link(pubId, api.avatar_name(pubId)),
        ' at ',
        h('code', address.host, address.port ? ':' + address.port : '')
      ]
    }
  }

}
