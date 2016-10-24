var lightbox = require('hyperlightbox')
var h = require('hyperscript')
var u = require('../util')
var self_id = require('../keys').id
//publish or add

var plugs = require('../plugs')

var publish = plugs.first(exports.sbot_publish = [])
var message_content = plugs.first(exports.message_content = [])
var avatar = plugs.first(exports.avatar = [])
var message_meta = plugs.map(exports.message_meta = [])

exports.message_confirm = function (content, cb) {

  cb = cb || function () {}

  var lb = lightbox()
  document.body.appendChild(lb)

  var msg = {
    key: "DRAFT",
    value: {
      author: self_id,
      previous: null,
      sequence: null,
      timestamp: Date.now(),
      content: content
    }
  }

  var okay = h('button', 'okay', {onclick: function () {
    lb.remove()
    publish(content, cb)
  }})

  var cancel = h('button', 'cancel', {onclick: function () {
    lb.remove()
    cb(null)
  }})

  okay.addEventListener('keydown', function (ev) {
    if(ev.keyCode === 27) cancel.click() //escape
  })

  lb.show(h('div.column.message-confirm',
    h('div.message', 
      h('div.title.row',
        h('div.avatar', avatar(msg.value.author, 'thumbnail')),
        h('div.message_meta.row', message_meta(msg))
      ),
      h('div.message_content', message_content(msg)
        || h('pre', JSON.stringify(content, null, 2)))
    ),
    h('div.row.message-confirm__controls', okay, cancel)
  ))

  okay.focus()

}



















