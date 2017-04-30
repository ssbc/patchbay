const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const next = require('../../../junk/next-stepper')

exports.gives = nest({
  'app.html': {
    page: true,
    menuItem: true
  }
})

exports.needs = nest({
  'app.html': {
    filter: 'first',
    scroller: 'first'
  },
  'app.sync.goTo': 'first',
  'feed.pull': {
    mentions: 'first',
    public: 'first'
  },
  'keys.sync.id': 'first',
  'message.html.render': 'first'
})

exports.create = function (api) {
  const route = '/notifications'

  return nest({
    'app.html': {
      page: notificationsPage,
      menuItem: menuItem
    }
  })

  function menuItem () {
    return h('a', {
      style: { order: 3 },
      'ev-click': () => api.app.sync.goTo(route)
    }, route)
  }

  function notificationsPage (path) {
    if (path !== route) return

    const id = api.keys.sync.id()

    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [ filterMenu ] })

    function draw () {
      resetFeed({ container, content })

      pull(
        next(api.feed.pull.mentions(id), {old: false, limit: 100}),
        filterDownThrough(),
        Scroller(container, content, api.message.html.render, true, false)
      )

      pull(
        next(api.feed.pull.mentions(id), {reverse: true, limit: 100, live: false}),
        filterUpThrough(),
        Scroller(container, content, api.message.html.render, false, false)
      )
    }
    draw()

    return container
  }
}

