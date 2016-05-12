
var ui = require('../ui')

exports.screen_view = function (path, sbot) {
  if(path === '/')
    return ui.createStream(
      sbot.createLogStream({limit: 100, reverse: true}),
      ui.createRenderers(exports.message_render, sbot)
    )
}

exports.message_render = []






