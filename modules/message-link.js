var h = require('hyperscript')

exports.message_link = function (el, id, sbot) {
  console.log('MESSAGE_LINK', el, id)
  if(el) return el

  var link = h('a', {href: '#'+id}, id.substring(0, 10)+'...')

  sbot.get(id, function (err, value) {
    if(err) return
    console.log('LINKED', value)
    if(value.content.text)
      link.textContent = value.content.text.substring(0, 40)+'...'
  })

  return link
}


