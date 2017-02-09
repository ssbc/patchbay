var h = require('hyperscript')
var u = require('../../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

exports.needs = {
  helpers: { build_scroller: 'first' },
  message: {
    render: 'first',
    compose: 'first'
  },
  sbot: { log: 'first' }
}

exports.gives = {
  menu_items: true,
  page: true
}

exports.create = function (api) {
  return {
    menu_items: function () {
      return h('a', {href: '#/git-ssb'}, '/git-ssb')
    },

    page: function (path, sbot) {
      if(path === '/git-ssb') {

        var { container, content } = api.helpers.build_scroller()

        pull(
          u.next(api.sbot.log, {old: false, limit: 100}),
          Scroller(container, content, api.message.render, true, false)
        )

        pull(
          u.next(api.sbot.log, {reverse: true, limit: 100, live: false}),
          pull.filter(function(msg) { return msg.value.content.type }),
          pull.filter(function(msg) {
            return msg.value.content.type.match(/^git/)
          }),
          Scroller(container, content, api.message.render, false, false)
        )

        return container
      }
    }
  }
}
