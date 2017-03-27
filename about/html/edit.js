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

exports.gives = nest('about.html.edit')

exports.needs = nest({
  'about.obs': {
    name: 'first',
    imageUrl: 'first',
    description: 'first'
  },
  'blob.sync.url': 'first',
  'keys.sync.id': 'first',
  'message.html.confirm': 'first',
  sbot: {
    'async.addBlob': 'first',
    'pull.links': 'first'
  }
})

exports.create = function (api) {
  return nest({
    'about.html.edit': edit
  })

  // TODO refactor this to use obs better
  function edit (id) {
    var avatar = Struct({
      current: api.about.obs.imageUrl(id),
      new: MutantObject()
    })

    const links = api.sbot.pull.links

    var name = Struct({
      current: api.about.obs.name(id),
      new: Value()
    })

    // TODO use patchcores observable images + names
    var images = MutantArray()
    pull(
      links({dest: id, rel: 'about', values: true}),
      pull.map(e => e.value.content.image),
      pull.filter(e => e && typeof e.link === 'string'),
      pull.unique('link'),
      pull.drain(image => images.push(image))
    )

    var namesRecord = MutantObject()
    // TODO constrain query to one name per peer?
    pull(
      links({dest: id, rel: 'about', values: true}),
      pull.map(e => e.value.content.name),
      pull.filter(Boolean),
      pull.drain(name => {
        var n = namesRecord.get(name) || 0
        namesRecord.put(name, n + 1)
      })
    )
    var names = dictToCollection(namesRecord)

    var lb = hyperlightbox()

    var isPossibleUpdate = computed([name.new, avatar.new], (name, avatar) => {
      return name || avatar.link
    })

    var avatarSrc = computed([avatar], avatar => {
      if (avatar.new.link) return api.blob.sync.url(avatar.new.link)
      else return avatar.current
    })

    var displayedName = computed([name], name => {
      if (name.new) return name.new
      else return name.current
    })

    return h('AboutEditor', [
      h('section.lightbox', lb),
      h('section.avatar', [
        h('section', [
          h('img', { src: avatarSrc })
        ]),
        h('footer', displayedName)
      ]),
      h('section.description', api.about.obs.description(id)),
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
        if (err) throw err

        if (data) {
          var _data = dataurl.parse(data)
          pull(
            pull.once(_data.data),
            api.sbot.async.addBlob((err, hash) => {
              if (err) throw err // TODO check if this is safely caught by error catcher

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

      api.message.html.confirm(msg, (err, data) => {
        if (err) return console.error(err)

        clearNewSelections()

        // TODO - update aliases displayed
      })
    }
  }
}

function crop (d, cb) {
  var canvas = hypercrop(h('img', {src: d}))

  return h('AboutImageEditor', [
    h('header', 'Click and drag to crop your avatar.'),
    canvas,
    // canvas.selection,
    h('section.actions', [
      h('button.cancel', { 'ev-click': () => cb(new Error('canceled')) }, 'cancel'),
      h('button.okay', { 'ev-click': () => cb(null, canvas.selection.toDataURL()) }, 'okay')
    ])
  ])
}

