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
  'feed.pull.public': 'first',
  'message.html': {
    compose: 'first',
    render: 'first'
  },
  'app.html.scroller': 'first'
})

exports.create = function (api) {
  const route = '/public'

  return nest({
    'app.html': {
      page: publicPage,
      menuItem: menuItem
    }
  })

  function menuItem (handleClick) {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => handleClick(route)
    }, route)
  }

  function publicPage (path) {
    if (path !== route) return

    const composer = api.message.html.compose({
      meta: { type: 'post' },
      placeholder: 'Write a public message'
    })
    const { container, content } = api.app.html.scroller({ prepend: composer })

    pull(
      next(api.feed.pull.public, {old: false, limit: 100}),
      Scroller(container, content, api.message.html.render, true, false)
    )

    pull(
      next(api.feed.pull.public, {reverse: true, limit: 100, live: false}),
      Scroller(container, content, api.message.html.render, false, false)
    )

    return container
  }
}

