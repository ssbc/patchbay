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
  'feed.pull': {
    mentions: 'first',
    public: 'first'
  },
  'keys.sync.id': 'first',
  'app.html.scroller': 'first',
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

  function menuItem (handleClick) {
    return h('a', {
      style: { order: 3 },
      'ev-click': () => handleClick(route)
    }, route)
  }

  function notificationsPage (path) {
    if (path !== route) return
    const id = api.keys.sync.id()
    const mentions = api.feed.pull.mentions(id)

    const { container, content } = api.app.html.scroller({})

    pull(
      next(mentions, {old: false, limit: 100}),
      Scroller(container, content, api.message.html.render, true, false)
    )

    pull(
      next(mentions, {reverse: true, limit: 100, live: false}),
      Scroller(container, content, api.message.html.render, false, false)
    )
    return container
  }
}

