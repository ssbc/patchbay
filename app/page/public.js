const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')

const next = require('../../junk/next-stepper')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.public': true
})

exports.needs = nest({
  'app.html.filter': 'first',
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
  'feed.pull.public': 'first',
  'message.html.compose': 'first',
  'message.html.render': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.public': publicPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'public' })
    }, '/public')
  }

  function publicPage (location) {
    const composer = api.message.html.compose({
      location,
      meta: { type: 'post' },
      placeholder: 'Write a public message'
    })
    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [composer, filterMenu] })

    // TODO : build a pull-stream which has seperate state + rendering
    function draw () {
      resetFeed({ container, content })

      const render = (msg) => {
        // if (msg.value.content.type === 'about') debugger
        return api.message.html.render(msg)
      }

      // TODO - change to use ssb-query, streamed by publish time
      pull(
        next(api.feed.pull.public, {old: false, limit: 100, live: true}, ['timestamp']),
        filterUpThrough(),
        Scroller(container, content, render, true, false)
      )

      pull(
        next(api.feed.pull.public, {reverse: true, limit: 100, live: false}, ['timestamp']),
        filterDownThrough(),
        Scroller(container, content, render, false, false)
      )
    }
    draw()

    container.title = '/public'
    return container
  }
}
