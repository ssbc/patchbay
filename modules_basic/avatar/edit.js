'use strict'
const fs = require('fs')
const dataurl = require('dataurl-')
const hyperfile = require('hyperfile')
const hypercrop = require('hypercrop')
const hyperlightbox = require('hyperlightbox')
const h = require('../../h')
const {
  Value, Array: MutantArray, Dict: MutantObject, Struct,
  map, computed, when, dictToCollection
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

    var avatar = Struct({
      original: Value(visualize(new Buffer(id.substring(1), 'base64'), 256).src),
      new: MutantObject()
    })

    getAvatar({links: api.sbot_links}, self_id, id, (err, _avatar) => {
      if (err) return console.error(err)
      //don't show user has already selected an avatar.
      if(ref.isBlob(_avatar.image))
        avatar.original.set(api.blob_url(_avatar.image))
    })

    var name = Struct({
      original: Value(api.avatar_name(id)),
      new: Value()
    })

    var images = MutantArray()
    pull(
      api.sbot_links({dest: id, rel: 'about', values: true}),
      pull.map(e => e.value.content.image),
      pull.filter(e => e && 'string' == typeof e.link),
      pull.unique('link'),
      pull.drain(image => images.push(image) )
    )

    var namesRecord = MutantObject()
    // TODO constrain query to one name per peer?
    pull(
      api.sbot_links({dest: id, rel: 'about', values: true}),
      pull.map(e => e.value.content.name),
      pull.filter(Boolean),
      pull.drain(name => {
        var n = namesRecord.get(name) || 0
        namesRecord.put(name, n+1)
      })
    )
    var names = dictToCollection(namesRecord)

    var lb = hyperlightbox()
  
    // TODO load this in, make this editable
    var description = ''

    var isPossibleUpdate = computed([name.new, avatar.new], (name, avatar) => {
      return name || avatar.link
    })

    var avatarSrc = computed([avatar], avatar => {
      if (avatar.new.link) return api.blob_url(avatar.new.link)
      else return avatar.original
    })

    var displayedName = computed([name], name => {
      if (name.new) return '@'+name.new
      else return name.original
    })

    return h('ProfileEdit', [
      h('section.lightbox', lb),
      h('section.avatar', [
        h('section', [
          h('img', { src: avatarSrc }),
        ]),
        h('footer', displayedName),
      ]),
      h('section.description', description),
      h('section.aliases', [
        h('header', 'Aliases'),
        h('section.avatars', [
          h('header', 'Avatars'),
          map(images, image => h('img', {
            'src': api.blob_url(image),
            'ev-click': () => avatar.new.set(image)
          })),
          h('div.file-upload', [
            hyperfile.asDataURL(dataUrlCallback)
          ])
        ]),
        h('section.names', [
          h('header', 'Names'),
          h('section', [
            map(names, n => h('div', { 'ev-click': () => name.new.set(n.key()) }, [
              h('div.name', n.key),
              h('div.count', n.value)
            ])),
            h('input', {
              placeholder: ' + another name',
              'ev-keyup': e => name.new.set(e.target.value)
            })
          ])
        ]),
        when(isPossibleUpdate, h('section.action', [
          h('button.cancel', { 'ev-click': clearNewSelections }, 'cancel'),
          h('button.confirm', { 'ev-click': handleUpdateClick }, 'confirm changes')
        ]))
      ])
    ])

    function dataUrlCallback (data) {
      var el = crop(data, (err, data) => {
        if(data) {
          var _data = dataurl.parse(data)
          pull(
            pull.once(_data.data),
            api.sbot_blobs_add((err, hash) => {
              //TODO. Alerts are EVIL.
              //I use them only in a moment of weakness.

              if(err) return alert(err.stack)
              avatar.new.set({
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

    function clearNewSelections () {
      name.new.set(null)
      avatar.new.set({})
    }

    function handleUpdateClick () {
      const newName = name.new()
      const newAvatar = avatar.new()

      const msg = {
        type: 'about',
        about: id
      }

      if (newName) msg.name = newName
      if (newAvatar.link) msg.image = newAvatar

      api.message_confirm(msg, (err, data) => {
        if (err) return console.error(err)

        if (newName) name.original.set('@'+newName)
        if (newAvatar.link) avatar.original.set(api.blob_url(newAvatar.link))

        clearNewSelections()

        // TODO - update aliases displayed
      })
    }
  }

}

