var h = require('hyperscript')
var moment = require('moment')

exports.message_meta = function (msg) {
  return h('a', {href: '#/'+msg.key}, moment(msg.value.timestamp).fromNow())
}
