const nest = require('depnest')
const dataurl = require('dataurl-')
const hyperfile = require('hyperfile')
const hypercrop = require('hypercrop')
const hyperlightbox = require('hyperlightbox')
const {
  h, Value, Array: MutantArray, Dict: MutantObject, Struct,
  map, computed, when, dictToCollection
} = require('mutant')
const pull = require('pull-stream')
const getAvatar = require('ssb-avatar')
const ref = require('ssb-ref')
const visualize = require('visualize-buffer')

function crop (d, cb) {
  var canvas = hypercrop(h('img', {src: d}))

  return h('AboutImageEditor', [
    h('header', 'Click and drag to crop your avatar.'),
    canvas,
    //canvas.selection,
    h('section.actions', [
      h('button.cancel', {'ev-click': () => cb(new Error('canceled')) }, 'cancel'),
      h('button.okay', {'ev-click': () => cb(null, canvas.selection.toDataURL()) }, 'okay')
    ])
  ])
}

exports.needs = nest({
  'about.obs.name': 'first',
  'keys.sync.id': 'first',
  'blob.sync.url':'first',
  sbot: {
    'async.addBlob': 'first',
    'pull.links': 'first'
  }
  // 'message.confirm': 'first',
})

exports.gives = nest('about.html.edit')

exports.create = function (api) {
  return nest({
    'about.html.edit': edit 
  })

  function edit (id) {
    var avatar = Struct({
      original: Value(visualize(new Buffer(id.substring(1), 'base64'), 256).src),
      new: MutantObject()
    })

    const links = api.sbot.pull.links

    getAvatar({ links }, api.keys.sync.id(), id, (err, _avatar) => {
      if (err) return console.error(err)
      //don't show user has already selected an avatar.
      if(ref.isBlob(_avatar.image))
        avatar.original.set(api.blob.sync.url(_avatar.image))
    })

    var name = Struct({
      original: computed(api.about.obs.name(id), name => '@'+name),
      new: Value()
    })

    var images = MutantArray()
    pull(
      links({dest: id, rel: 'about', values: true}),
      pull.map(e => e.value.content.image),
      pull.filter(e => e && 'string' == typeof e.link),
      pull.unique('link'),
      pull.drain(image => images.push(image) )
    )

    var namesRecord = MutantObject()
    // TODO constrain query to one name per peer?
    pull(
      links({dest: id, rel: 'about', values: true}),
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
      if (avatar.new.link) return api.blob.sync.url(avatar.new.link)
      else return avatar.original
    })

    var displayedName = computed([name], name => {
      if (name.new) return '@'+name.new
      else return name.original
    })

    return h('AboutEditor', [
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
            'src': api.blob.sync.url(image.link),
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
            api.sbot.async.addBlob((err, hash) => {
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

      api.message.confirm(msg, (err, data) => {
        if (err) return console.error(err)

        if (newName) name.original.set('@'+newName)
        if (newAvatar.link) avatar.original.set(api.blob.sync.url(newAvatar.link))

        clearNewSelections()

        // TODO - update aliases displayed
      })
    }
  }

}


