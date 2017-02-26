const nest = require('depnest')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const next = require('../../../junk/next-stepper')

exports.gives = nest('router.html.page')

exports.needs = nest({
  'feed.pull.public': 'first',
  'message.html': {
    compose: 'first',
    render: 'first'
  },
  'main.html.scroller': 'first'
})

exports.create = function (api) {
  return nest('router.html.page', publicPage)

  function publicPage (path) {
    if (path !== '/public') return

    const composer = api.message.html.compose({
      meta: { type: 'post' },
      placeholder: 'Write a public message'
    })
    const { container, content } = api.main.html.scroller({ prepend: composer })

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

