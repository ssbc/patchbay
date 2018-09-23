const nest = require('depnest')
const { h, Value } = require('mutant')
const { isMsg } = require('ssb-ref')

exports.needs = nest({
  'about.html.avatar': 'first',
  'keys.sync.id': 'first',
  'message.html.action': 'map',
  'message.html.author': 'first',
  'message.html.backlinks': 'first',
  'message.html.meta': 'map',
  'message.html.timestamp': 'first',
  'sbot.async.run': 'first'
})

exports.gives = nest('message.html.layout')

exports.create = (api) => {
  return nest('message.html.layout', messageLayout)

  function messageLayout (msg, opts = {}) {
    const { layout, showUnread = true } = opts
    if (!(layout === undefined || layout === 'default')) return

    var { author, timestamp, meta, action, backlinks } = api.message.html
    if (!isMsg(msg.key)) action = () => {}

    var rawMessage = Value(null)

    var el = h('Message -default',
      { attributes: { tabindex: '0' } }, // needed to be able to navigate and show focus()
      [
        h('section.avatar', {}, api.about.html.avatar(msg.value.author)),
        h('section.top', [
          h('div.author', {}, author(msg)),
          h('div.title', {}, opts.title),
          h('div.meta', {}, meta(msg, { rawMessage }))
        ]),
        h('section.content', {}, opts.content),
        h('section.raw-content', rawMessage),
        h('section.bottom', [
          h('div.timestamp', {}, timestamp(msg)),
          h('div.actions', {}, action(msg))
        ]),
        h('footer.backlinks', {}, backlinks(msg))
      ]
    )

    // UnreadFeature (search codebase for this if extracting)
    if (showUnread && !myMessage(msg)) {
      api.sbot.async.run(server => {
        server.unread.isRead(msg.key, (err, isRead) => {
          if (err) console.error(err)

          if (!isRead) el.classList.add('-unread')
          else el.classList.add('-read')
        })
      })
    }
    // ^ this could be in message/html/decorate
    // but would require opts to be passed to decorators in patchcore

    return el
  }

  function myMessage (msg) {
    return msg.value.author === api.keys.sync.id()
  }
}
