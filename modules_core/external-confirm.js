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

    lb.show(h('div.column',
      h('div', [
        h('div.title.row', [
          h('strong.row', [
            'Do you want to open this external link in your default browser:'
          ])
        ]),
        h('div', [
          h('pre', href)
        ])
      ]),
      h('div.row', [
        okay, 
        cancel
      ])
    ))

    okay.focus()
  }
}
