const nest = require('depnest')
const { h, Value } = require('mutant')

exports.needs = nest({
  'app.sync.goTo': 'first',
  'message.html.backlinks': 'first',
  'message.html.author': 'first',
  'message.html.meta': 'map',
  'message.html.timestamp': 'first'
})

exports.gives = nest('message.html.layout')

exports.create = (api) => {
  return nest('message.html.layout', miniLayout)

  function miniLayout (msg, opts) {
    if (opts.layout !== 'mini') return

    var rawMessage = Value(null)

    return h('Message -mini', {
      attributes: {
        tabindex: '0'
      }
    }, [
      h('section.timestamp', {}, api.message.html.timestamp(msg)),
      h('header.author', {}, api.message.html.author(msg, { size: 'mini' })),
      h('section.meta', {}, api.message.html.meta(msg, { rawMessage })),
      h('section.content', { 'ev-click': () => api.app.sync.goTo(msg) }, opts.content),
      h('section.raw-content', rawMessage)
    ])
  }
}
