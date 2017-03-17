const nest = require('depnest')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const next = require('../../../junk/next-stepper')

exports.gives = nest('router.html.page')
exports.needs = nest({
  'keys.sync.id': 'first',
  'feed.pull.mentions': 'first',
  'feed.pull.public': 'first',
  'message.html': {
    render: 'first'
  },
  'main.html.scroller': 'first'
})
exports.create = function (api) {
  return nest('router.html.page', (path) => {
    if (path !== '/notifications') return
    const id = api.keys.sync.id()
    const mentions = api.feed.pull.mentions(id)

    const { container, content } = api.main.html.scroller({})

    pull(
      next(mentions, {old: false, limit: 100}),
      Scroller(container, content, api.message.html.render, true, false)
    )

    pull(
      next(mentions, {reverse: true, limit: 100, live: false}),
      Scroller(container, content, api.message.html.render, false, false)
    )
    return container
  })
}

