var lightbox = require('hyperlightbox')
var h = require('hyperscript')
var u = require('../util')
//publish or add

exports.publish = []
exports.message_content = []

exports.message_confirm = function (content, sbot) {

  var lb = lightbox()
  document.body.appendChild(lb)

  var okay = h('button', 'okay', {onclick: function () {
    u.firstPlug(exports.publish, content, null, sbot)
    lb.remove()
  }})

  var cancel = h('button', 'cancel', {onclick: function () {
    lb.remove()
  }})

  var hidden = h('input', {style: {visible: 'hidden'}})


  okay.addEventListener('keydown', function (ev) {
    if(ev.keyCode === 27) cancel.click() //escape
  })

  lb.show(h('div.column',
    u.firstPlug(exports.message_content,
      {key: "DRAFT", value: {content: content}}, sbot
    ) || h('pre', JSON.stringify(content, null, 2)),
    h('div.row', okay, cancel)
  ))

  okay.focus()

//  hidden.focus()

}














