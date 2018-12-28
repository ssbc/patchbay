var h = require('mutant/h')
var nest = require('depnest')

exports.gives = nest('message.html.reply')

exports.needs = nest({
  'app.sync.goTo': 'first'
})

exports.create = (api) => {
  return nest('message.html.reply', function betterReply (msg) {
    return h('i.MessageReply.fa.fa-comment',
      {
        title: 'reply',
        'ev-click': (ev) => {
          ev.preventDefault()
          api.app.sync.goTo({ action: 'reply', key: msg.key, value: msg.value })
        }
      }
    )
  })
}
