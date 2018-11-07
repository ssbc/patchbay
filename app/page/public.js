const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const next = require('pull-next-query')
const merge = require('lodash/merge')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.public': true
})

exports.needs = nest({
  'app.html.filter': 'first',
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
  // 'feed.pull.public': 'first',
  'sbot.pull.stream': 'first',
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

    const createStream = (opts) => api.sbot.pull.stream(server => {
      const _opts = merge({}, opts, {
        query: [{
          $filter: {
            timestamp: {$gt: 0, $lt: undefined},
            value: {
              content: { recps: {$not: true} }
            }
          }
        }],
        limit: 100
      })

      return next(server.query.read, _opts, ['timestamp'])
    })

    // TODO : build a pull-stream which has seperate state + rendering
    function draw () {
      resetFeed({ container, content })

      const render = (msg) => {
        // if (msg.value.content.type === 'about') debugger
        return api.message.html.render(msg)
      }

      // TODO - change to use ssb-query, streamed by publish time
      pull(
        createStream({old: false, live: true}),
        filterUpThrough(),
        Scroller(container, content, render, true, false)
      )

      pull(
        createStream({reverse: true, live: false}),
        filterDownThrough(),
        Scroller(container, content, render, false, false)
      )
    }
    draw()

    container.title = '/public'
    return container
  }
}
