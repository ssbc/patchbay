const h = require('mutant/h')
const nest = require('depnest')

exports.gives = nest('message.html.author')

exports.needs = nest('about.html.link', 'first')

exports.create = function (api) {
  return nest('message.html.author', message_author)

  function message_author (msg) {
    return h('div', {title: msg.value.author}, [
      api.about.html.link(msg.value.author) 
    ])
  }
}

