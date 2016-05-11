
var h = require('hyperscript')

exports.message_content = function (msg) {
  if(msg.value.content && msg.value.content.type === 'vote')
  return h('div', msg.value.content.vote.value > 0 ? 'yup' : 'nah',
      h('a', {href: '#/msg/'+msg.value.content.vote.link}, msg.key)
    )
}
