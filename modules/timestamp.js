var h = require('hyperscript')
var moment = require('moment')

exports.message_meta = function (msg) {
  return h('a.enter', {href: '#'+msg.key}, moment(msg.value.timestamp).fromNow())
}
