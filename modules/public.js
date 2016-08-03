var h = require('hyperscript')
var ui = require('../ui')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

var plugs = require('../plugs')
var message_render = plugs.first(exports.message_render = [])
var message_compose = plugs.first(exports.message_compose = [])
var sbot_log = plugs.first(exports.sbot_log = [])

var HighWatermark = require('pull-high-watermark')

exports.screen_view = function (path, sbot) {
  if(path === '/public') {

    var content = h('div.column.scroller__content')
    var div = h('div.column.scroller',
      {style: {'overflow':'auto'}},
      h('div.scroller__wrapper',
        message_compose({type: 'post'}), //header
        content
      )
    )

    pull(
      sbot_log({old: false}),
      Scroller(div, content, message_render, true, false)
    )

    pull(
      u.next(sbot_log, {reverse: true, limit: 100, live: false}),
//      HighWatermark(100),
      Scroller(div, content, message_render, false, false)
    )

    return div
  }
}



















