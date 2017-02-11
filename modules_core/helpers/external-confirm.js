const lightbox = require('hyperlightbox')
const fs = require('fs')
const h = require('../../h')
const open = require('open-external')

exports.gives = {
  helpers: { external_confirm: true },
  mcss:true
}

exports.create = function (api) {
  return {
    helpers: { external_confirm },
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function external_confirm (href) {
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
