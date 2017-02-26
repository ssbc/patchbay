const { h } = require('mutant')
var nest = require('depnest')

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
  return nest('message.html.layout', message_layout)

  function message_layout (msg, opts) {
    if (!(opts.layout === undefined || opts.layout === 'default')) return

    return h('Message', [
      h('section.avatar', {}, api.about.html.image(msg.value.author)),
      h('section.timestamp', {}, api.message.html.timestamp(msg)),
      h('header.author', {}, api.message.html.author(msg)),
      h('section.meta', {}, api.message.html.meta(msg)),
      h('section.title', {}, opts.title),
      h('section.content', {}, opts.content),
      h('section.raw-content'),
      h('section.actions', {}, api.message.html.action(msg)),
      h('footer.backlinks', {}, api.message.html.backlinks(msg))
    ])
  }
}

