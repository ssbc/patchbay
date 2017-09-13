const nest = require('depnest')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const { h } = require('mutant')

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

    var subscribed = api.channel.obs.subscribed(api.keys.sync.id())

    function subscribeToChannel(btn) {
      btn.target.replaceWith(unsubscribeButton())
      api.sbot.async.publish({
        type: 'channel',
        channel: channelName,
        subscribed: true
      })
    }

    function unsubscribeFromChannel(btn) {
      btn.target.replaceWith(subscribeButton())
      api.sbot.async.publish({
        type: 'channel',
        channel: channelName,
        subscribed: false
      })
    }

    function unsubscribeButton() {
      return h('button', { 'ev-click': unsubscribeFromChannel }, 'Unsubscribe from channel')
    }

    function subscribeButton() {
      return h('button', { 'ev-click': subscribeToChannel }, 'Subscribe to channel')
    }

    const channelHeader = h('span', subscribed.has(channelName)() ? unsubscribeButton() : subscribeButton())

    const composer = api.message.html.compose({ meta: { type: 'post', channel: channelName } })
    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [composer, filterMenu, channelHeader] })

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
