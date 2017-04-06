const nest = require('depnest')
const lightbox = require('hyperlightbox')
const { h } = require('mutant')
// publish or add

exports.gives = nest('message.html.confirm')

exports.needs = nest({
  message: {
    'async.publish': 'first',
    'html.render': 'first'
  },
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest({
    'message.html': { confirm }
  })

  function confirm (content, cb) {
    cb = cb || function () {}

    var lb = lightbox()
    document.body.appendChild(lb)

    var msg = {
      key: 'DRAFT',
      value: {
        author: api.keys.sync.id(),
        previous: null,
        sequence: null,
        timestamp: Date.now(),
        content: content
      }
    }

    var okay = h('button.okay', {
      'ev-click': () => {
        lb.remove()
        api.message.async.publish(content, cb)
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

    okay.addEventListener('keydown', (ev) => {
      if (ev.keyCode === 27) cancel.click() // escape
    })

    lb.show(h('MessageConfirm', [
      h('header -preview_description', [
        h('h1', 'Preview')
      ]),
      h('section -message_preview', api.message.html.render(msg)),
      h('section -actions', [cancel, okay])
    ]))

    okay.focus()
  }
}

