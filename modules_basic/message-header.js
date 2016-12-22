var fs = require('fs')
var Path = require('path')
var h = require('../h')

exports.needs = {
  avatar_link: 'first',
  avatar_image: 'first',
  avatar_name: 'first',
  message_meta: 'map',
  message_link: 'first',
  timestamp: 'first'
}

exports.gives = {
  message_header: true,
  mcss: true
}

exports.create = function (api) {
  return {
    message_header,
    mcss: () => fs.readFileSync(Path.join(__dirname, 'message-header.mcss'))
  }

  function message_header (msg) {
    var { value } = msg
    var { author } = value
    return h('MessageHeader', [
      h('section.author', [
        api.avatar_link(author, api.avatar_image(author, 'thumbnail')),
        api.avatar_link(author, api.avatar_name(author)),
        api.timestamp(msg)
      ]),
      h('section.meta', api.message_meta(msg))
    ])
  }
}


