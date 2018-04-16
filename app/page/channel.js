const nest = require('depnest')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const { h, when } = require('mutant')

exports.gives = nest('app.page.channel')

exports.needs = nest({
  'app.html.filter': 'first',
  'app.html.scroller': 'first',
  'feed.pull.channel': 'first',
  'message.html.compose': 'first',
  'message.html.render': 'first',
  'channel.obs.subscribed': 'first',
  'keys.sync.id': 'first',
  'sbot.async.publish': 'first'
})

exports.create = function (api) {
  return nest('app.page.channel', channelView)

  function channelView (location) {
    const { channel } = location

    const channelName = channel.substr(1)
    const myKey = api.keys.sync.id()
    var subscribed = api.channel.obs.subscribed(myKey).has(channelName)

    function toggleSubscription () {
      api.sbot.async.publish({
        type: 'channel',
        channel: channelName,
        subscribed: !subscribed()
      })
    }

    const subscribeButton = h('Button -subscribe',
      { 'ev-click': toggleSubscription },
      when(subscribed, 'Unsubscribe from channel', 'Subscribe to channel')
    )

    const composer = api.message.html.compose({
      location,
      meta: { type: 'post', channel: channelName } })
    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [subscribeButton, composer, filterMenu] })

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

    var page = h('Page -channel', {title: channel}, [
      // filterMenu, // TODO - extract non-scroller els like filterMenu here
      container
    ])

    // TODO better scroll hack for keyboard shortcuts
    page.scroll = container.scroll

    return page
  }
}
