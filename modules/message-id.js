
var h = require('hyperscript')

exports.message_meta = function (msg) {
  return h('div',h('input', {value: msg.key, readonly:'', onclick: function (ev) {
    ev.target.select()
    ev.stopPropagation()
    ev.preventDefault()
  }}))
}
