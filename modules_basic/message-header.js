var fs = require('fs')
var Path = require('path')
var h = require('../h')

exports.needs = {
  avatar: 'first',
  message_meta: 'map',
  message_link: 'first'
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
    return h('MessageHeader', [
      h('section.author', api.avatar(msg.value.author, 'thumbnail')),
      h('section.meta', api.message_meta(msg))
    ])
  }
}


