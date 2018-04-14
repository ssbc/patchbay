var h = require('mutant/h')
var nest = require('depnest')

exports.needs = nest({
  'app.sync.goTo': 'first'
})

exports.gives = nest('message.html.action')

exports.create = (api) => {
  return nest('message.html.action', function reply (msg) {
    return h('a', {
        href: '#',
      'ev-click': () => api.app.sync.goTo({ action: 'quote', key: msg.key, value: msg.value })
      }, 'Quote')
  })
}
