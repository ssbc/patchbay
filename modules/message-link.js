var h = require('hyperscript')

var sbot_get = require('../plugs').first(exports.sbot_get = [])

exports.message_link = function (id) {

  if('string' !== typeof id)
    throw new Error('link must be to message id')

  var link = h('a', {href: '#'+id}, id.substring(0, 10)+'...')

  sbot_get(id, function (err, value) {
    if(err) return console.error(err)
    if(value.content.text)
      link.textContent = value.content.text.substring(0, 40)+'...'
  })

  return link
}





