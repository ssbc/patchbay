const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('message.html.meta')

exports.needs = nest({
  'about.obs.name': 'first',
  'message.obs.likes': 'first'
})

exports.create = (api) => {
  return nest('message.html.meta', private)

  function private (msg) {
    if (msg.value.private) {
      return h('i.fa.fa-lock', {
        title: 'Private'
      })
    } else {
      return null;
    }
  }
}
