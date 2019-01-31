const nest = require('depnest')
const pull = require('pull-stream')
const pullMerge = require('pull-merge')
const Scroller = require('pull-scroll')
const { h } = require('mutant')

exports.gives = nest('app.page.channels')

exports.needs = nest({
  'app.html.filter': 'first',
  'app.html.scroller': 'first',
  'feed.pull.channel': 'first',
  'message.html.compose': 'first',
  'message.html.render': 'first',
  'sbot.async.publish': 'first'
})

exports.create = function (api) {
  return nest('app.page.channels', channelView)

  function channelView (location) {
    const { channels } = location
    if (!Array.isArray(channels)) return

    const channelNames = channels.map(c => c.substr(1))

    const { filterMenu, filterDownThrough, filterUpThrough, resetFeed } = api.app.html.filter(draw)
    const { container, content } = api.app.html.scroller({ prepend: [filterMenu] })

    function draw () {
      resetFeed({ container, content })

      const Source = (opts) => pull(
        pullMerge(
          channelNames.map(name => api.feed.pull.channel(name)(opts)),
          (a, b) => {
            if (opts.reverse) return (a.value.timestamp > b.value.timestamp) ? -1 : +1
            else return (a.value.timestamp < b.value.timestamp) ? -1 : +1
          }
        ),
        pull.unique(m => m.key)
      )

      pull(
        Source({ old: false }),
        filterUpThrough(),
        Scroller(container, content, render, true, false)
      )

      pull(
        Source({ reverse: true }),
        filterDownThrough(),
        Scroller(container, content, render, false, false)
      )
    }
    draw()

    // TODO rollups
    function render (msg) {
      return api.message.html.render(msg, { showTitle: true })
    }

    var page = h('Page -channels', { title: channels.join(' + ') }, [
      // filterMenu, // TODO - extract non-scroller els like filterMenu here
      container
    ])

    // TODO better scroll hack for keyboard shortcuts
    page.keyboardScroll = container.keyboardScroll

    return page
  }
}
