
var h = require('hyperscript')
var u = require('../util')

exports.message_content = function (msg, sbot) {
  if(msg.value.content.type !== 'vote') return
  var link = msg.value.content.vote.link
  return h('div', msg.value.content.vote.value > 0 ? 'yup' : 'nah',
      u.decorate(exports.message_link, link, function (d, e, v) { return d(e, v, sbot) })
    )
}

exports.message_link = []


