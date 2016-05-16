var h = require('hyperscript')
var u = require('../util')
exports.avatar = []

//render a message when someone follows someone,
//so you see new users
exports.message_content = function (msg, sbot) {

  if(msg.value.content.type == 'contact') {
    return h('div.contact',
      'follows',
      u.first(exports.avatar, function (plug) {
        return plug(msg.value.content.contact, sbot)
      })
    )
  }
}






