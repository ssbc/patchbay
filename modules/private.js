var h = require('hyperscript')
var ui = require('../ui')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

function unbox () {
  return pull(
    pull.filter(function (msg) {
      return 'string' == typeof msg.value.content
    }),
    pull.map(function (msg) {
      return u.firstPlug(exports.message_unbox, msg)
    }),
    pull.filter(Boolean)
  )
}

exports.screen_view = function (path, sbot) {
  if(path === '/private') {

    var content = h('div.column')

    var div = h('div.column', {style: {'overflow':'auto'}}, content)
    var render = ui.createRenderers(exports.message_render, sbot)

    pull(
      sbot.createLogStream({old: false}),
      unbox(),
      Scroller(div, content, render, true, false)
    )

    pull(
      u.next(sbot.createLogStream, {reverse: true, limit: 1000}),
      unbox(),
      Scroller(div, content, render, false, false, function (err) {
        if(err) throw err
      })
    )

    return div
  }
}

exports.message_render = []
exports.message_compose = []
exports.message_unbox = []












