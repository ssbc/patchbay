var ref = require('ssb-ref')
var ui = require('../ui')

exports.screen_view = function (id, sbot) {
  if(ref.isFeed(id))
    return ui.createStream(
      sbot.createUserStream({id: id, limit: 100, reverse: true}),
      ui.createRenderers(exports.message_render, sbot)
    )
}

exports.message_render = []





