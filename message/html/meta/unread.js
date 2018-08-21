const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('message.html.meta')

exports.needs = nest({
  'about.obs.name': 'first',
  'message.obs.likes': 'first'
})

exports.create = (api) => {
  return nest('message.html.meta', unread)

  // UnreadFeature (search codebase for this if extracting)
  function unread (msg) {
    return h('i.unread.fa.fa-bell', {
      title: 'A new message',
      style: { order: 98 }
    })
  }
}
