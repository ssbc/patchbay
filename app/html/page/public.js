const nest = require('depnest')
const { h, Value, when } = require('mutant')
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


    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)

    const composer = api.message.html.compose({
      meta: { type: 'post' },
      placeholder: 'Write a public message'
    })

    const { container, content } = api.app.html.scroller({ prepend: [filterMenu, composer] })

    // TODO : build a pull-stream which has seperate state + rendering
    function draw () {
      resetFeed({ container, content })

      pull(
        next(api.feed.pull.public, {old: false, limit: 100}),
        filterDownThrough(),
        Scroller(container, content, api.message.html.render, true, false)
      )

      pull(
        next(api.feed.pull.public, {reverse: true, limit: 100, live: false}),
        filterUpThrough(),
        Scroller(container, content, api.message.html.render, false, false)
      )
    }
    draw()

    return container
  }
}

