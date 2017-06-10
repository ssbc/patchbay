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
  'feed.pull.public': 'first',
  'message.html': {
    compose: 'first',
    render: 'first'
  }
})

exports.create = function (api) {
  const route = '/public'

  return nest({
    'app.html': {
      page: publicPage,
      menuItem
    }
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo(route)
    }, route)
  }

  function publicPage (path) {
    if (path !== route) return

    const composer = api.message.html.compose({
      meta: { type: 'post' },
      placeholder: 'Write a public message'
    })
    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [composer, filterMenu] })

    // TODO : build a pull-stream which has seperate state + rendering
    function draw () {
      resetFeed({ container, content })

      const ren = (msg) => {
        if (msg.value.content.type === 'about') debugger
        api.message.html.render(msg)
      }

      pull(
        next(api.feed.pull.public, {old: false, limit: 100}),
        filterDownThrough(),
        Scroller(container, content, api.message.html.render, true, false)
        // Scroller(container, content, ren, true, false)
      )

      pull(
        next(api.feed.pull.public, {reverse: true, limit: 100, live: false}),
        filterUpThrough(),
        Scroller(container, content, api.message.html.render, false, false)
        // Scroller(container, content, ren, true, false)
      )
    }
    draw()

    return container
  }
}

