'use strict'
const fs = require('fs')
const dataurl = require('dataurl-')
const hyperfile = require('hyperfile')
const hypercrop = require('hypercrop')
const hyperlightbox = require('hyperlightbox')
const h = require('../../h')
const {
  Value, Array: MutantArray, Dict: MutantObject,
  map, computed, when
} = require('@mmckegg/mutant')
const pull = require('pull-stream')
const getAvatar = require('ssb-avatar')
const ref = require('ssb-ref')
const visualize = require('visualize-buffer')
const self_id = require('../../keys').id

function crop (d, cb) {
  var canvas = hypercrop(h('img', {src: d}))

  return h('div.column.avatar_pic', [
    canvas,
    //canvas.selection,
    h('div.row.avatar_pic__controls', [
      h('button', {'ev-click': () => cb(null, canvas.selection.toDataURL()) }, 'okay'),
      h('button', {'ev-click': () => cb(new Error('canceled')) }, 'cancel')
    ])
  ])
}

exports.needs = {
  message_confirm: 'first',
  sbot_blobs_add: 'first',
  blob_url: 'first',
  sbot_links: 'first',
  avatar_name: 'first'
}

exports.gives = {
  avatar_edit: true,
  mcss: true
}

exports.create = function (api) {
  return {
    avatar_edit,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function avatar_edit (id) {
    var img = visualize(new Buffer(id.substring(1), 'base64'), 256)

    var proposedAvatar = MutantObject()
    getAvatar({links: api.sbot_links}, self_id, id, (err, avatar) => {
      if (err) return console.error(err)
      //don't show user has already selected an avatar.
      if(proposedAvatar.keys().length) return
      if(ref.isBlob(avatar.image))
        img.src = api.blob_url(avatar.image)
    })

    var images = MutantArray()
    pull(
      api.sbot_links({dest: id, rel: 'about', values: true}),
      pull.map(e => e.value.content.image),
      pull.filter(e => e && 'string' == typeof e.link),
      pull.unique('link'),
      pull.drain(image =>  images.push(image) )
    )

    var lb = hyperlightbox()
    var name = Value(api.avatar_name(id))
    var proposedName = Value()
    var names = [] //TODO load in name aliases
    var name_input = h('input', {placeholder: ' + another name', 'ev-keyup': (e) => proposedName.set(e.target.value) })
    var description = '' //TODO load this in, make this editable

    var isPossibleUpdate = computed([proposedName, proposedAvatar], (name, image) => {
      return name || Object.keys(image).length
    })

    return h('ProfileEdit', [
      h('section.lightbox', lb),
      h('section.avatar', [
        h('section', img),
        h('footer', name),
      ]),
      h('section.description', description),
      h('section.aliases', [
        h('header', 'Aliases'),
        h('section.avatars', [
          h('header', 'Avatars'),
          map(images, image => h('img', {
            'src': api.blob_url(image),
            'ev-click': changeSelectedImage(image)
          })),
          h('div.file-upload', [
            hyperfile.asDataURL(dataUrlCallback)
          ])
        ]),
        h('section.names', [
          h('header', 'Names'),
          names,
          name_input
        ]),
        when(isPossibleUpdate, h('button.confirm', { 'ev-click': handleUpdateClick }, 'Confirm changes'))
      ])
    ])

    function changeSelectedImage (image) {
      return () => {
        proposedAvatar.set(image)
        img.src = api.blob_url(image.link || image)
      }
    }

    function dataUrlCallback (data) {
      var el = crop(data, (err, data) => {
        if(data) {
          img.src = data
          var _data = dataurl.parse(data)
          pull(
            pull.once(_data.data),
            api.sbot_blobs_add((err, hash) => {
              //TODO. Alerts are EVIL.
              //I use them only in a moment of weakness.

              if(err) return alert(err.stack)
              proposedAvatar.set({
                link: hash,
                size: _data.data.length,
                type: _data.mimetype,
                width: 512,
                height: 512
              })
            })
          )
        }
        lb.close()
      })
      lb.show(el)
    }

    function handleUpdateClick () {
      const name = proposedName()
      const avatar = proposedAvatar()

      const msg = {
        type: 'about',
        about: id
      }

      if (name) msg.name = name 
      if (Object.keys(avatar).length) msg.image = avatar

      api.message_confirm(msg)

      if (name) name.set('@'+name)
    }
  }

}

