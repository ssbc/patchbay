const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('message.html.author')

exports.needs = nest('about.html.link', 'first')

exports.create = function (api) {
  return nest('message.html.author', messageAuthor)

  function messageAuthor (msg) {
    return h('div', {title: msg.value.author}, [
      api.about.html.link(msg.value.author)
    ])
  }
}
