const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const next = require('pull-next-step')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.notifications': true
})

exports.needs = nest({
  'app.html.filter': 'first',
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
  'feed.pull.mentions': 'first',
  'feed.pull.public': 'first',
  'keys.sync.id': 'first',
  'message.html.render': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.notifications': notificationsPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 3 },
      'ev-click': () => api.app.sync.goTo({ page: 'notifications' })
    }, '/notifications')
  }

  function notificationsPage (location) {
    const id = api.keys.sync.id()

    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [ filterMenu ] })
    const removeMyMessages = () => pull.filter(msg => msg.value.author !== id)
    const removePrivateMessages = () => pull.filter(msg => msg.value.private !== true)

    function draw () {
      resetFeed({ container, content })

      pull(
        next(api.feed.pull.mentions(id), {old: false, limit: 100, property: ['timestamp']}),
        removeMyMessages(),
        removePrivateMessages(),
        filterDownThrough(),
        Scroller(container, content, api.message.html.render, true, false)
      )

      pull(
        next(api.feed.pull.mentions(id), {reverse: true, limit: 100, live: false, property: ['timestamp']}),
        removeMyMessages(),
        removePrivateMessages(),
        filterUpThrough(),
        Scroller(container, content, api.message.html.render, false, false)
      )
    }
    draw()

    container.title = '/notifications'
    return container
  }
}
