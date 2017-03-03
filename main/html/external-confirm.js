const nest = require('depnest')
const lightbox = require('hyperlightbox')
const { h } = require('mutant')
const open = require('open-external')

exports.gives = nest('main.html.externalConfirm')

exports.create = function (api) {
  return nest('main.html.externalConfirm', externalConfirm)

  function externalConfirm (href) {
    var lb = lightbox()
    document.body.appendChild(lb)

    var okay = h('button.okay', {
      'ev-click': () => {
        lb.remove()
        open(href)
      }},
      'open'
    )

    var cancel = h('button.cancel', {
      'ev-click': () => {
        lb.remove()
      }},
      'cancel'
    )

    okay.addEventListener('keydown', function (ev) {
      if (ev.keyCode === 27) cancel.click() // escape
    })

    lb.show(h('ExternalConfirm', [
      h('header', 'External link'),
      h('section.prompt', [
        h('div.question', 'Open this link in your external browser?'),
        h('pre.link', href)
      ]),
      h('section.actions', [cancel, okay])
    ]))

    okay.focus()
  }
}

