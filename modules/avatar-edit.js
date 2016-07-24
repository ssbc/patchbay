var dataurl = require('dataurl')

var hyperfile = require('hyperfile')

var hypercrop = require('hypercrop')
var hyperlightbox = require('hyperlightbox')
var h = require('hyperscript')

function crop (d, cb) {
  var data
  var canvas = hypercrop(h('img', {src: d}))

  return h('div.avatar_pic',
    canvas,
    //canvas.selection,
    h('div.avatar_pic__controls',
      h('button', 'okay', {onclick: function () {
        cb(null, canvas.selection.toDataURL())
      }}),
      h('button', 'cancel', {onclick: function () {
        cb(new Error('canceled'))
      }})
    )
  )
}

var plugs = require('../plugs')
var confirm = plugs.first(exports.message_confirm = [])
var sbot_blobs_add = plugs.first(exports.sbot_blobs_add = [])

var pull = require('pull-stream')

exports.avatar_edit = function (id) {
  var lb = hyperlightbox()
  var img = h('img', {src: ''}) //TODO, show current image.
  var name = h('input', {placeholder: 'rename'})

  var selected = null

  return h('div',
    lb,
    img,
    name,
    hyperfile.asDataURL(function (data) {
      var el = crop(data, function (err, data) {
        if(data) {
          img.src = data
          selected = dataurl.parse(data)
        }
        lb.close()
      })
      lb.show(el)
    }),
    h('button', 'update', {onclick: function () {
      if(selected) {
        pull(
          pull.once(selected.data),
          sbot_blobs_add(function (err, hash) {
            //TODO. Alerts are EVIL.
            //I use them only in a moment of weakness.
            if(err) return alert(err.stack)
            confirm({
              type: 'about',
              about: id,
              name: name.value || undefined,
              image: {
                link: hash,
                size: selected.data.length,
                type: selected.mimetype,
                width: 512,
                height: 512
              }
            })
          })
        )
      }
      else if(input.value) //name only
        confirm({
          type: 'about',
          about: id,
          name: name.value || undefined,
        })
      else
        //another moment of weakness
        alert('must select a name or image')
    }})
  )
}








