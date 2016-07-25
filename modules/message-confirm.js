var lightbox = require('hyperlightbox')
var h = require('hyperscript')
var u = require('../util')
//publish or add

var plugs = require('../plugs')

var publish = plugs.first(exports.sbot_publish = [])
var message_content = plugs.first(exports.message_content = [])

exports.message_confirm = function (content, cb) {

  cb = cb || function () {}

  var lb = lightbox()
  document.body.appendChild(lb)

  var okay = h('button', 'okay', {onclick: function () {
    lb.remove()
    publish(content, cb)
  }})

  var cancel = h('button', 'cancel', {onclick: function () {
    lb.remove()
  }})

  okay.addEventListener('keydown', function (ev) {
    if(ev.keyCode === 27) cancel.click() //escape
  })

  lb.show(h('div.column.message-confirm',
    message_content({key: "DRAFT", value: {content: content}})
      || h('pre', JSON.stringify(content, null, 2)),
    h('div.row.message-confirm__controls', okay, cancel)
  ))

  okay.focus()

}


















