var h = require('hyperscript')
var ui = require('../ui')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

exports.screen_view = function (path, sbot) {
  if(path === '/') {
    var content = h('div.column')
    var div = h('div.column', {style: {'overflow':'auto'}},
      u.firstPlug(exports.message_compose, {type: 'post'}, sbot),
      content
    )
    var render = ui.createRenderers(exports.message_render, sbot)

    pull(
      sbot.createLogStream({old: false}),
      Scroller(div, content, render, true, false)
    )

    pull(
      u.next(sbot.createLogStream, {reverse: true, limit: 100, live: false}),
      Scroller(div, content, render, false, false)
    )

    return div
  }
}

exports.message_render = []
exports.message_compose = []








