var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

var plugs = require('../plugs')
var message_render = plugs.first(exports.message_render = [])
var message_compose = plugs.first(exports.message_compose = [])
var sbot_log = plugs.first(exports.sbot_log = [])
var sbot_query = plugs.first(exports.sbot_query = [])

exports.message_meta = function (msg) {
  var chan = msg.value.content.channel
  if (chan)
    return h('a', {href: '##'+chan}, '#'+chan)
}

exports.screen_view = function (path) {
  if(path[0] === '#') {
    var channel = path.substr(1)

    var content = h('div.column.scroller__content')
    var div = h('div.column.scroller',
      {style: {'overflow':'auto'}},
      h('div.scroller__wrapper',
        message_compose({type: 'post', channel: channel}),
        content
      )
    )

    function matchesChannel(msg) {
      if (msg.sync) console.error('SYNC', msg)
      var c = msg && msg.value && msg.value.content
      return c && c.channel === channel
    }

    pull(
      sbot_log({old: false}),
      pull.filter(matchesChannel),
      Scroller(div, content, message_render, true, false)
    )

    pull(
      sbot_query({query: [
        {$filter: {value: {content: {channel: channel}}}}
      ]}),
      Scroller(div, content, message_render, false, false)
    )

    return div
  }
}
