var h = require('hyperscript')
var u = require('../util')
var avatar = require('../plugs').first(exports.avatar = [])

//render a message when someone follows someone,
//so you see new users
exports.message_content = function (msg, sbot) {

  if(msg.value.content.type == 'contact') {
    return h('div.contact',
      'follows',
      avatar(msg.value.content.contact)
    )
  }
}








