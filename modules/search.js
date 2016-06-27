var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

var plugs = require('../plugs')
var message_render = plugs.first(exports.message_render = [])
var sbot_search = plugs.first(exports.sbot_search = [])

exports.screen_view = function (path) {
  if(path[0] === '?') {
    var query = path.substr(1)

    var content = h('div.column.scroller__content')
    var div = h('div.column.scroller',
      {style: {'overflow':'auto'}},
      h('div.scroller__wrapper',
        content
      )
    )

    pull(
      sbot_search({query: query, old: false}),
      Scroller(div, content, message_render, true, false)
    )

    pull(
      u.next(sbot_search, {query: query,
        reverse: true, limit: 100, live: false}),
      Scroller(div, content, message_render, false, false)
    )

    return div
  }
}
