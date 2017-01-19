'use strict'
var dataurl = require('dataurl-')
var hyperfile = require('hyperfile')
var hypercrop = require('hypercrop')
var hyperlightbox = require('hyperlightbox')
var h = require('hyperscript')
var pull = require('pull-stream')
var getAvatar = require('ssb-avatar')
var ref = require('ssb-ref')
var visualize = require('visualize-buffer')
var self_id = require('../../keys').id

function crop (d, cb) {
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

exports.needs = {
  message_confirm: 'first',
  sbot_blobs_add: 'first',
  blob_url: 'first',
  sbot_links: 'first',
  avatar_name: 'first'
}

exports.gives = 'avatar_edit'

exports.create = function (api) {
  return function (id) {

    var img = visualize(new Buffer(id.substring(1), 'base64'), 256)
    img.classList.add('avatar--large')

    var lb = hyperlightbox()
    var name_input = h('input', {placeholder: 'rename'})
    var name = api.avatar_name(id)
    var selected = null

    getAvatar({links: api.sbot_links}, self_id, id, function (err, avatar) {
      if (err) return console.error(err)
      //don't show user has already selected an avatar.
      if(selected) return
      if(ref.isBlob(avatar.image))
        img.src = api.blob_url(avatar.image)
    })

    var also_pictured = h('div.profile__alsopicturedas.wrap')

    pull(
      api.sbot_links({dest: id, rel: 'about', values: true}),
      pull.map(function (e) {
        return e.value.content.image
      }),
      pull.filter(function (e) {
        return e && 'string' == typeof e.link
      }),
      pull.unique('link'),
      pull.drain(function (image) {
        also_pictured.appendChild(
          h('a', {href:'#', onclick: function (ev) {
              ev.stopPropagation()
              ev.preventDefault()
              selected = image
              img.src = api.blob_url(image.link || image)
            }},
            h('img.avatar--thumbnail', {src: api.blob_url(image)})
          )
        )
      })
    )

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
              var _data = dataurl.parse(data)
              pull(
                pull.once(_data.data),
                api.sbot_blobs_add(function (err, hash) {
                  //TODO. Alerts are EVIL.
                  //I use them only in a moment of weakness.

                  if(err) return alert(err.stack)
                  selected = {
                    link: hash,
                    size: _data.data.length,
                    type: _data.mimetype,
                    width: 512,
                    height: 512
                  }

                })
              )
            }
            lb.close()
          })
          lb.show(el)
        }),
        h('button', 'update', {onclick: function () {
          if(name_input.value)
            name.textContent = name_input.value

          if(selected)
            api.message_confirm({
              type: 'about',
              about: id,
              name: name_input.value || undefined,
              image: selected
            })
          else if(name_input.value) //name only
            api.message_confirm({
              type: 'about',
              about: id,
              name: name_input.value || undefined,
            })
          else
            //another moment of weakness
            alert('must select a name or image')
        }}),
      also_pictured
      )
    )
  }
}
