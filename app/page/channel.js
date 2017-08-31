const nest = require('depnest')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')

exports.gives = nest('app.page.channel')

exports.needs = nest({
  'app.html.filter': 'first',
  'app.html.scroller': 'first',
  'feed.pull.channel': 'first',
  'message.html.compose': 'first',
  'message.html.render': 'first'
})

exports.create = function (api) {
  return nest('app.page.channel', channelView)

  function channelView (location) {
    const { channel } = location

    const channelName = channel.substr(1)
    const composer = api.message.html.compose({ meta: { type: 'post', channelName } })
    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [composer, filterMenu] })

    function draw () {
      resetFeed({ container, content })

      const openChannelSource = api.feed.pull.channel(channelName)

      pull(
        openChannelSource({old: false}),
        filterUpThrough(),
        Scroller(container, content, api.message.html.render, true, false)
      )

      pull(
        openChannelSource({reverse: true}),
        filterDownThrough(),
        Scroller(container, content, api.message.html.render, false, false)
      )
    }
    draw()

    container.title = channel
    return container
  }
}

