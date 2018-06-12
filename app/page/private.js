const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const ref = require('ssb-ref')

const next = require('../../junk/next-stepper')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.private': true
})

exports.needs = nest({
  'app.html': {
    filter: 'first',
    scroller: 'first'
  },
  'app.sync.goTo': 'first',
  'feed.pull.private': 'first',
  'keys.sync.id': 'first',
  'message.html': {
    compose: 'first',
    render: 'first'
  }
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.private': privatePage
  })

  function menuItem () {
    return h('a', {
      style: { order: 2 },
      'ev-click': () => api.app.sync.goTo({ page: 'private' })
    }, '/private')
  }

  function privatePage (location) {
    const id = api.keys.sync.id()

    const composer = api.message.html.compose({
      location,
      meta: { type: 'post' },
      prepublish: content => {
        content.recps = [id, ...(content.mentions || [])]
          .filter(m => ref.isFeed(typeof m === 'string' ? m : m.link))
        return content
      },
      placeholder: 'Write a private message. \n\n@mention users in the first message to start a private thread.'}
    )
    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [ composer, filterMenu ] })

    function draw () {
      resetFeed({ container, content })

      pull(
        next(api.feed.pull.private, {old: false, limit: 100}, ['value', 'timestamp']),
        filterDownThrough(),
        Scroller(container, content, api.message.html.render, true, false)
      )

      pull(
        next(api.feed.pull.private, {reverse: true, limit: 100, live: false}, ['value', 'timestamp']),
        filterUpThrough(),
        Scroller(container, content, api.message.html.render, false, false)
      )
    }
    draw()

    container.title = '/private'
    return container
  }
}
