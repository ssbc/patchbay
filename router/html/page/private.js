const { h } = require('mutant')
const nest = require('depnest')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const next = require('../../../junk/next-stepper')
const ref = require('ssb-ref')

exports.gives = nest('router.html.page')

exports.needs = nest({
  'feed.pull.private': 'first',
  'keys.sync.id': 'first',
  'main.html.scroller': 'first',
  'message.html': {
    compose: 'first',
    render: 'first',
  },
})

exports.create = function (api) {
  return nest('router.html.page', privatePage)
  
  function privatePage (path) {
    if (path !== '/private') return

    const id = api.keys.sync.id()

    const composer = api.message.html.compose({
      meta: { type: 'post' }, 
      prepublish: meta => {
        meta.recps = [id, ...meta.mentions]
          .filter(m => ref.isFeed(typeof m  === 'string' ? m : m.link))
        return meta
      },
      placeholder: 'Write a private message. \n\n@mention users in the first message to start a private thread.'}
    )
    const { container, content } = api.main.html.scroller({ prepend: composer })

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

