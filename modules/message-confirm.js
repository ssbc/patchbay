var lightbox = require('hyperlightbox')
var h = require('hyperscript')
var u = require('../util')
//publish or add

exports.publish = []
exports.message_content = []

exports.message_confirm = function (content, sbot) {

  var lb = lightbox()
  document.body.appendChild(lb)

  lb.show(h('div.column',
    u.firstPlug(exports.message_content,
      {key: "DRAFT", value: {content: content}}, sbot
    ) || h('pre', JSON.stringify(content, null, 2)),
    h('div.row',
      h('button', 'okay', {onclick: function () {
        u.firstPlug(exports.publish, content, null, sbot)
        lb.remove()
      }}),
      h('button', 'cancel', {onclick: function () {
        lb.remove()
      }})
    )
  ))

}


