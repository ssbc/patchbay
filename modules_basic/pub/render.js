var h = require('hyperscript')

exports.needs = {
  about: {
    name: 'first',
    link: 'first'
  }
}

exports.gives = {
  message: { content: true }
}

exports.create = function (api) {
  return {
    message: { content }
  }

  function content (msg, sbot)  {
    var c = msg.value.content
    if (c.type !== 'pub') return

    var address = c.address || {}

    return [
      h('p', 'announced an address for ',
        api.about.link(address.key, api.about.name(address.key)), ':'),
      h('blockquote',
        h('code', address.host + ':' + address.port)
      )
    ]
  }
}

