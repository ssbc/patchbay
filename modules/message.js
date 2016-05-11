var h = require('hyperscript')
var u = require('../util')

exports.message_render = function (msg, sbot) {
  var el = u.first(exports.message_content, function (fn) {
    return fn(msg)
  })

  if(el) console.log(el)

  function map (plugs, value) {
    return plugs.map(function (plug) {
      return plug(value, sbot)
    }).filter(Boolean)
  }

  if(el)
    return h('div.message',
      h('div.title',
        h('div.avatar', map(exports.avatar, msg.value.author)),
        h('div.metadata', map(exports.message_meta, msg))
      ),
      h('div.content', el),
      h('div.footer',
        h('div.actions', map(exports.message_actions))
      )
    )
}

exports.message_content = []
exports.avatar = []
exports.message_meta = []
exports.message_action = []

