var h = require('hyperscript')

exports.needs = {
  about_name: 'first',
  about_link: 'first'
}

exports.gives = {
  message_content: true,
}

exports.create = function (api) {
  return {
    message_content
  }

  function message_content (msg, sbot)  {
    var c = msg.value.content
    if (c.type !== 'pub') return

    var address = c.address || {}

    return [
      h('p', 'announced an address for ',
        api.about_link(address.key, api.about_name(address.key)), ':'),
      h('blockquote',
        h('code', address.host + ':' + address.port)
      )
    ]
  }
}

