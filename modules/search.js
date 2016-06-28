var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

var plugs = require('../plugs')
var message_render = plugs.first(exports.message_render = [])
var sbot_log = plugs.first(exports.sbot_log = [])

function searchFilter(query) {
  var search = new RegExp(query, 'i')
  return function (msg) {
    var c = msg && msg.value && msg.value.content
    return c && (
      msg.key == query ||
      c.text && search.test(c.text) ||
      c.name && search.test(c.name) ||
      c.title && search.test(c.title))
  }
}

exports.screen_view = function (path) {
  if(path[0] === '?') {
    var query = path.substr(1)
    var matchesQuery = searchFilter(query)

    var content = h('div.column.scroller__content')
    var div = h('div.column.scroller',
      {style: {'overflow':'auto'}},
      h('div.scroller__wrapper',
        content
      )
    )

    pull(
      sbot_log({old: false}),
      pull.filter(matchesQuery),
      Scroller(div, content, message_render, true, false)
    )

    pull(
      u.next(sbot_log, {reverse: true, limit: 500, live: false}),
      pull.filter(matchesQuery),
      Scroller(div, content, message_render, false, false)
    )

    return div
  }
}
