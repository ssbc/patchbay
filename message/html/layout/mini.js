const nest = require('depnest')
const { h, Value } = require('mutant')

exports.needs = nest('message.html', {
  backlinks: 'first',
  author: 'first',
  meta: 'map',
  timestamp: 'first'
})

exports.gives = nest('message.html.layout')

exports.create = (api) => {

  return nest('message.html.layout', message_layout)

  function message_layout (msg, opts) {
    if (opts.layout !== 'mini') return

    var rawMessage = Value(null)

    return h('div', {
      classList: 'Message -mini'
    }, [
      h('header.author', {}, api.message.html.author(msg, { size: 'mini' })),
      h('section.timestamp', {}, api.message.html.timestamp(msg)),
      h('section.meta', {}, api.message.html.meta(msg, { rawMessage })),
      h('section.content', {}, opts.content),
      h('section.raw-content', rawMessage)
    ])
  }
}

