const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const next = require('../../../junk/next-stepper')
const ref = require('ssb-ref')

exports.gives = nest({
  'app.html': {
    page: true,
    menuItem: true
  }
})

exports.needs = nest({
  'feed.pull.private': 'first',
  'keys.sync.id': 'first',
  'app.html.scroller': 'first',
  'message.html': {
    compose: 'first',
    render: 'first'
  }
})

exports.create = function (api) {
  const route = '/private'

  return nest({
    'app.html': {
      page: privatePage,
      menuItem: menuItem
    }
  })

  function menuItem (handleClick) {
    return h('a', {
      style: { order: 2 },
      'ev-click': () => handleClick(route)
    }, route)
  }

  function privatePage (path) {
    if (path !== route) return

    const id = api.keys.sync.id()

    const composer = api.message.html.compose({
      meta: { type: 'post' },
      prepublish: meta => {
        meta.recps = [id, ...meta.mentions]
          .filter(m => ref.isFeed(typeof m === 'string' ? m : m.link))
        return meta
      },
      placeholder: 'Write a private message. \n\n@mention users in the first message to start a private thread.'}
    )
    const { container, content } = api.app.html.scroller({ prepend: composer })

    pull(
      next(api.feed.pull.private, {old: false, limit: 100}),
      Scroller(container, content, api.message.html.render, true, false)
    )

    pull(
      next(api.feed.pull.private, {reverse: true, limit: 100, live: false}),
      Scroller(container, content, api.message.html.render, false, false)
    )

    return container
  }
}

