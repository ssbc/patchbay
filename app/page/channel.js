const nest = require('depnest')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const { h, when } = require('mutant')

exports.gives = nest('app.page.channel')

exports.needs = nest({
  'app.html.filter': 'first',
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
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

    function render (msg) {
      const text = msg.value.content.text
      if (text) {
        msg.value.content.text = text.substr(0, 240) + '...'
      }

      const goMsg = (ev) => {
        ev.stopPropagation()
        api.app.sync.goTo(msg)
      }
      const style = {
        cursor: 'pointer'
      }

      return h('div', { 'ev-click': goMsg, style }, api.message.html.render(msg))
    }

    function draw () {
      resetFeed({ container, content })

      const openChannelSource = api.feed.pull.channel(channelName)

      pull(
        openChannelSource({old: false}),
        pull.filter(m => !m.value.content.root),
        filterUpThrough(),
        Scroller(container, content, render, true, false)
      )

      pull(
        openChannelSource({reverse: true}),
        pull.filter(m => !m.value.content.root),
        filterDownThrough(),
        Scroller(container, content, render, false, false)
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
