var nest = require('depnest')
const { h, Value } = require('mutant')

exports.needs = nest({
  'message.html': {
    backlinks: 'first',
    author: 'first',
    meta: 'map',
    action: 'map',
    timestamp: 'first'
  },
  'about.html.image': 'first'
})

exports.gives = nest('message.html.layout')

exports.create = (api) => {
  return nest('message.html.layout', messageLayout)

  function messageLayout (msg, opts) {
    if (!(opts.layout === undefined || opts.layout === 'default')) return

    var rawMessage = Value(null)

    const attributes = {
      tabindex: '0', // needed to be able to navigate and show focus()
      'data-key': msg.key,
      'data-text': msg.value.content.text
    }
    if (msg.value.content.root) attributes['data-root'] = msg.value.content.root

    return h('Message', { attributes }, [
      h('section.avatar', {}, api.about.html.image(msg.value.author)),
      h('section.timestamp', {}, api.message.html.timestamp(msg)),
      h('header.author', {}, api.message.html.author(msg)),
      h('section.meta', {}, api.message.html.meta(msg, { rawMessage })),
      h('section.title', {}, opts.title),
      h('section.content', {}, opts.content),
      h('section.raw-content', rawMessage),
      h('section.actions', {}, api.message.html.action(msg)),
      h('footer.backlinks', {}, api.message.html.backlinks(msg))
    ])
  }
}

