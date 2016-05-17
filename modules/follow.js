var h = require('hyperscript')
var u = require('../util')
exports.avatar = []

//render a message when someone follows someone,
//so you see new users
exports.message_content = function (msg, sbot) {

  if(msg.value.content.type == 'contact') {
    return h('div.contact',
      'follows',
      u.firstPlug(exports.avatar, msg.value.content.contact, sbot)
    )
  }
}








