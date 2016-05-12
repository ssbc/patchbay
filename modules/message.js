var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')

exports.message_render = function (msg, sbot) {
  var el = u.first(exports.message_content, function (fn) {
    return fn(msg, sbot)
  })

  if(el) console.log(el)

  function map (plugs, value) {
    return plugs.map(function (plug) {
      return plug(value, sbot)
    }).filter(Boolean)
  }

  var backlinks = h('div.backlinks')

  pull(
    sbot.links({dest: msg.key, rel: 'mentions', keys: true}),
    pull.collect(function (err, links) {
      if(links.length)
        backlinks.appendChild(h('label', 'backlinks:', 
          h('div', links.map(function (link) {
            return u.decorate(exports.message_link, link.key, function (d, e, v) { return d(e, v, sbot) })
          }))
        ))
    })
  )

  if(el)
    return h('div.message',
      h('div.title',
        h('div.avatar', map(exports.avatar, msg.value.author)),
        h('div.metadata', map(exports.message_meta, msg))
      ),
      h('div.content', el),
      h('div.footer',
        h('div.actions', map(exports.message_action))
      ),
      backlinks
    )
}

exports.message_content = []
exports.avatar = []
exports.message_meta = []
exports.message_action = []
exports.message_link = []
