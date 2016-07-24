var dataurl = require('dataurl')
var hyperfile = require('hyperfile')
var hypercrop = require('hypercrop')
var hyperlightbox = require('hyperlightbox')
var h = require('hyperscript')
var pull = require('pull-stream')
var getAvatar = require('ssb-avatar')
var plugs = require('../plugs')
var ref = require('ssb-ref')

var self_id = require('../keys').id
var default_avatar = '&qjeAs8+uMXLlyovT4JnEpMwTNDx/QXHfOl2nv2u0VCM=.sha256'

var confirm = plugs.first(exports.message_confirm = [])
var sbot_blobs_add = plugs.first(exports.sbot_blobs_add = [])
var blob_url = plugs.first(exports.blob_url = [])
var sbot_links = plugs.first(exports.sbot_links = [])
var avatar_name = plugs.first(exports.avatar_name = [])

function crop (d, cb) {
  var data
  var canvas = hypercrop(h('img', {src: d}))

  return h('div.column.avatar_pic',
    canvas,
    //canvas.selection,
    h('div.row.avatar_pic__controls',
      h('button', 'okay', {onclick: function () {
        cb(null, canvas.selection.toDataURL())
      }}),
      h('button', 'cancel', {onclick: function () {
        cb(new Error('canceled'))
      }})
    )
  )
}

exports.avatar_edit = function (id) {

  var img = h('img', {src: blob_url(default_avatar)})
  var lb = hyperlightbox()
  var name_input = h('input', {placeholder: 'rename'})
  var name = avatar_name(id)
  var selected = null

  getAvatar({links: sbot_links}, self_id, id, function (err, avatar) {
    if (err) return console.error(err)
    //don't show user has already selected an avatar.
    if(selected) return
    if(ref.isBlob(avatar.image))
      img.src = blob_url(avatar.image)
  })

  return h('div.row.profile',
    lb,
    img,
    h('div.column.profile__info',
      h('strong', name),
      name_input,

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
        if(name_input.value)
          name.textContent = name_input.value

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
                name: name_input.value || undefined,
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
            name: name_input.value || undefined,
          })
        else
          //another moment of weakness
          alert('must select a name or image')
      }})
    )
  )
}

