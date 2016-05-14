var h = require('hyperscript')
var ui = require('../ui')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

exports.screen_view = function (path, sbot) {
  if(path === '/') {

    var content = h('div.column')
    var div = h('div.column', {style: {'overflow':'auto'}},
      u.decorate(exports.message_compose, {}, function (d, e, v) {
        return d(e, v, sbot)
      }),
      content
    )
    var render = ui.createRenderers(exports.message_render, sbot)

    pull(
      sbot.createLogStream({reverse: true}),
      Scroller(div, content, render, false, false)
    )

    return div
  }
}

exports.message_render = []
exports.message_compose = []




