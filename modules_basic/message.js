var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')



var plugs = require('../plugs')
var message_content = plugs.first(exports.message_content = [])
var avatar = plugs.first(exports.avatar = [])
var message_meta = plugs.map(exports.message_meta = [])
var message_action = plugs.map(exports.message_action = [])
var message_link = plugs.first(exports.message_link = [])

var sbot_links = plugs.first(exports.sbot_links = [])

exports.message_render = function (msg, sbot) {
  var el = message_content(msg)
  if(!el) return

  var links = []
  for(var k in CACHE) {
    var _msg = CACHE[k]
    if(Array.isArray(_msg.content.mentions)) {
      for(var i = 0; i < _msg.content.mentions.length; i++)
        if(_msg.content.mentions[i].link == msg.key)
        links.push(k)
    }
  }

  var backlinks = h('div.backlinks')
  if(links.length)
    backlinks.appendChild(h('label', 'backlinks:', 
      h('div', links.map(function (key) {
        return message_link(key)
      }))
    ))


//  pull(
//    sbot_links({dest: msg.key, rel: 'mentions', keys: true}),
//    pull.collect(function (err, links) {
//      if(links.length)
//        backlinks.appendChild(h('label', 'backlinks:', 
//          h('div', links.map(function (link) {
//            return message_link(link.key)
//          }))
//        ))
//    })
//  )

  var msg = h('div.message',
    h('div.title.row',
      h('div.avatar', avatar(msg.value.author, 'thumbnail')),
      h('div.message_meta.row', message_meta(msg))
    ),
    h('div.message_content', el),
    h('div.message_actions.row',
      h('div.actions', message_action(msg),
        h('a', {href: '#' + msg.key}, 'Reply')
      )
    ),
    backlinks,
    {onkeydown: function (ev) {
      //on enter, hit first meta.
      if(ev.keyCode == 13) {
        msg.querySelector('.enter').click()
      }
    }}
  )

  // ); hyperscript does not seem to set attributes correctly.
  msg.setAttribute('tabindex', '0')

  return msg
}








