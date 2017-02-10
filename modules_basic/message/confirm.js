var fs = require('fs')
var lightbox = require('hyperlightbox')
var h = require('../../h')
var self_id = require('../../keys').id
//publish or add

exports.needs = {
  about: { image_name_link: 'first' },
  message: {
    publish: 'first',
    render: 'first'
  }
}

exports.gives = {
  message: { confirm: true }
}

exports.create = function (api) {
  return {
    message: { confirm }
  }

  function confirm (content, cb) {

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
        api.message.publish(content, cb)
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
      h('header -preview_description', [
        h('h1', 'Preview')
      ]),
      h('section -message_preview', api.message.render(msg)),
      h('section -actions', [cancel, okay])
    ]))

    okay.focus()
  }
}
