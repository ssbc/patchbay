var fs = require('fs')
var lightbox = require('hyperlightbox')
var h = require('../../h')
var self_id = require('../../keys').id
//publish or add

exports.needs = {
  publish: 'first',
  message_render: 'first',
  avatar: 'first',
  message_meta: 'map'
}

exports.gives = {
  message_confirm: true,
  mcss: true
}

exports.create = function (api) {
  return {
    message_confirm,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function message_confirm (content, cb) {

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

    var okay = h('button.okay',  {
      'ev-click': () => {
        lb.remove()
        api.publish(content, cb)
      }},
      'okay'
    )

    var cancel = h('button.cancel', {
      'ev-click': () => {
        lb.remove()
        cb(null)
      }},
      'cancel'
    )

    okay.addEventListener('keydown', function (ev) {
      if(ev.keyCode === 27) cancel.click() //escape
    })

    lb.show(h('MessageConfirm', [
        h('header -preview_description', h('h1', 'Preview')),
        h('section -message_preview', api.message_render(msg)),
        h('section -actions', [cancel, okay])
      ]
    ))

    okay.focus()
  }
}

