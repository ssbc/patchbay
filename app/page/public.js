const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')

const next = require('../../junk/next-stepper')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.public': true,
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
  const page = '/public'

  return nest({
    'app.html.menuItem': menuItem,
    'app.page.public': publicPage,
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page })
    }, page)
  }

  function publicPage (location) {
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
        next(api.feed.pull.public, {old: false, limit: 100}, ['value', 'timestamp']),
        filterDownThrough(),
        Scroller(container, content, api.message.html.render, true, false)
        // Scroller(container, content, ren, true, false)
      )

      pull(
        next(api.feed.pull.public, {reverse: true, limit: 100, live: false}, ['value', 'timestamp']),
        filterUpThrough(),
        Scroller(container, content, api.message.html.render, false, false)
        // Scroller(container, content, ren, true, false)
      )
    }
    draw()

    container.id = JSON.stringify(location)
    container.title = page
    return container
  }
}

