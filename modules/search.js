var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')
var TextNodeSearcher = require('text-node-searcher')

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

    function renderMsg(msg) {
      var el = message_render(msg)
      var searcher = new TextNodeSearcher({container: el})
      searcher.setQuery(query)
      searcher.highlight()
      return el
    }

    pull(
      sbot_log({old: false}),
      pull.filter(matchesQuery),
      Scroller(div, content, renderMsg, true, false)
    )

    pull(
      u.next(sbot_log, {reverse: true, limit: 500, live: false}),
      pull.filter(matchesQuery),
      Scroller(div, content, renderMsg, false, false)
    )

    return div
  }
}
