const nest = require('depnest')
const { h, Value } = require('mutant')
// const { isMsg } = require('ssb-ref')

exports.needs = nest({
  'about.html.avatar': 'first',
  'keys.sync.id': 'first',
  'message.html.author': 'first',
  'message.html.backlinks': 'first',
  'message.html.like': 'first',
  'message.html.meta': 'map',
  'message.html.quote': 'first',
  'message.html.reply': 'first',
  'message.html.timestamp': 'first',
  'sbot.async.run': 'first'
})

exports.gives = nest('message.html.layout')

exports.create = (api) => {
  return nest('message.html.layout', messageLayout)

  function messageLayout (msg, opts = {}) {
    if (!(opts.layout === undefined || opts.layout === 'default')) return
    const { showUnread = true, showTitle } = opts

    var { author, timestamp, like, meta, backlinks, quote, reply } = api.message.html

    var rawMessage = Value(null)

    var el = h('Message -default',
      { attributes: { tabindex: '0' } }, // needed to be able to navigate and show focus()
      [
        h('section.left', [
          h('div.avatar', {}, api.about.html.avatar(msg.value.author)),
          h('div.author', {}, author(msg)),
          h('div.timestamp', {}, timestamp(msg))
        ]),

        h('section.body', [
          showTitle ? h('div.title', {}, opts.title) : null,
          h('div.content', {}, opts.content),
          h('footer.backlinks', {}, backlinks(msg)),
          h('div.raw-content', rawMessage)
        ]),

        h('section.right', [
          h('div.meta', {}, meta(msg, { rawMessage })),
          // isMsg(msg.key) ?     // don't show actions if no msg.key
          h('div.actions', [
            like(msg),
            quote(msg),
            reply(msg)
          ])
        ])
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
