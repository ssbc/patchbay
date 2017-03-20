const nest = require('depnest')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')

exports.gives = nest('router.html.page')

exports.needs = nest({
  'feed.pull.channel': 'first',
  'main.html.scroller': 'first',
  message: {
    html: {
      compose: 'first',
      render: 'first'
    }
    // 'sync.unbox': 'first'
  }
})

exports.create = function (api) {
  return nest('router.html.page', channelView)

  function channelView (path) {
    if (path[0] !== '#') return

    var channel = path.substr(1)

    var composer = api.message.html.compose({ meta: { type: 'post', channel } })
    var { container, content } = api.main.html.scroller({ prepend: composer })

    var openChannelSource = api.feed.pull.channel(channel)

    pull(
      openChannelSource({old: false}),
      Scroller(container, content, api.message.html.render, true, false)
    )

    pull(
      openChannelSource({reverse: true}),
      Scroller(container, content, api.message.html.render, false, false)
    )

    return container
  }
}

