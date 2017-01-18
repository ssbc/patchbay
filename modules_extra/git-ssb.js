var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

exports.needs = {
  message_render: 'first',
  message_compose: 'first',
  sbot_log: 'first'
}

exports.gives = {
  menu_items: true, screen_view: true
}

exports.create = function (api) {
  return {
    menu_items: function () {
      return h('a', {href: '#/git-ssb'}, '/git-ssb')
    },

    screen_view: function (path, sbot) {
      if(path === '/git-ssb') {

        var content = h('div.column.scroller__content')
        var div = h('div.column.scroller',
          {style: {'overflow':'auto'}},
          h('div.scroller__wrapper', content)
        )

        pull(
          u.next(api.sbot_log, {old: false, limit: 100}),
          Scroller(div, content, api.message_render, true, false)
        )

        pull(
          u.next(api.sbot_log, {reverse: true, limit: 100, live: false}),
          pull.filter(function(msg) { return msg.value.content.type }),
          pull.filter(function(msg) {
            return msg.value.content.type.match(/^git/)
          }),
          Scroller(div, content, api.message_render, false, false)
        )

        return div
      }
    }
  }
}
