var lightbox = require('hyperlightbox')
var h = require('hyperscript')
var open = require('open-external')

exports.gives = 'external_confirm'

exports.create = function (api) {
  return function (href) {
    var lb = lightbox()
    document.body.appendChild(lb)

    var okay = h('button', 'open', {onclick: function () {
      lb.remove()
      open(href)
    }})

    var cancel = h('button', 'Cancel', {onclick: function () {
      lb.remove()
    }})

    okay.addEventListener('keydown', function (ev) {
      if (ev.keyCode === 27) cancel.click() // escape
    })

    lb.show(h('div.column.message-confirm',
      h('div.message',
        h('div.title.row',
          h('div.message_meta.row', h('strong', 'warning: '), 'please confirm opening the following link in your OSes browser:')
        ),
        h('div.message_content', h('pre', href))
      ),
      h('div.row.message-confirm__controls', okay, cancel)
    ))

    okay.focus()
  }
}
