const nest = require('depnest')
const { h, Value } = require('mutant')
const { isMsg } = require('ssb-ref')

exports.needs = nest({
  'message.html': {
    backlinks: 'first',
    author: 'first',
    meta: 'map',
    action: 'map',
    timestamp: 'first'
  },
  'about.html.avatar': 'first'
})

exports.gives = nest('message.html.layout')

exports.create = (api) => {
  return nest('message.html.layout', messageLayout)

  function messageLayout (msg, opts) {
    if (!(opts.layout === undefined || opts.layout === 'default')) return

    var { author, timestamp, meta, action, backlinks } = api.message.html
    if (!isMsg(msg.key)) action = () => {}

    var rawMessage = Value(null)

    return h('Message', {
      attributes: {
        tabindex: '0' // needed to be able to navigate and show focus()
      }
    }, [
      h('section.avatar', {}, api.about.html.avatar(msg.value.author)),
      h('section.timestamp', {}, timestamp(msg)),
      h('header.author', {}, author(msg)),
      h('section.meta', {}, meta(msg, { rawMessage })),
      h('section.title', {}, opts.title),
      h('section.content', {}, opts.content),
      h('section.raw-content', rawMessage),
      h('section.actions', {}, action(msg)),
      h('footer.backlinks', {}, backlinks(msg))
    ])
  }
}
