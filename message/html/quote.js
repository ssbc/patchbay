var h = require('mutant/h')
var nest = require('depnest')

exports.gives = nest('message.html.quote')

exports.needs = nest({
  'app.sync.goTo': 'first'
})

exports.create = (api) => {
  return nest('message.html.quote', function quote (msg) {
    return h('i.MessageQuote.fa.fa-quote-right',
      {
        'ev-click': (ev) => {
          ev.preventDefault()
          api.app.sync.goTo({ action: 'quote', key: msg.key, value: msg.value })
        },
        title: 'quote'
      }
    )
  })
}
