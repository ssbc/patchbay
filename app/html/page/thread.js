const { h, Struct, Value, Array: MutantArray, when, computed, map } = require('mutant')
const nest = require('depnest')
const pull = require('pull-stream')
const sort = require('ssb-sort')
const { isMsg, isFeed } = require('ssb-ref')

exports.gives = nest('app.html.page')

exports.needs = nest({
  'about.html.avatar': 'first',
  'app.html.scroller': 'first',
  'contact.obs.following': 'first',
  'keys.sync.id': 'first',
  message: {
    html: {
      compose: 'first',
      render: 'first'
    },
    'async.name': 'first',
    'sync.unbox': 'first'
  },
  sbot: {
    'async.get': 'first',
    'pull.links': 'first'
  }
})

exports.create = function (api) {
  return nest('app.html.page', threadPage)

  function threadPage (id) {
    if (!isMsg(id)) return

    var isPrivate = Value(false)
    var contactWarning = Value(false)
    var meta = Struct({
      type: 'post',
      root: Value(id),
      branch: Value(id),
      channel: Value(),
      recps: MutantArray()
    })
    const myId = api.keys.sync.id()
    const ImFollowing = api.contact.obs.following(myId)
    const header = when(isPrivate, [
      h('section.recipients', map(meta.recps, r => {
        const id = isFeed(r) ? r : r.link
        // if (id === myId) return null 

        var className
        if (contactIsTrouble(id)) {
          className = 'warning'
          contactWarning.set(true)
        }
        return h('div', { className }, api.about.html.avatar(id))
      })),
      when(contactWarning,
        h('section.info -warning', 'There is a person in this thread you do not follow (bordered in red). If you think you know this person it might be worth checking their profile to confirm they are who they say they are.'),
        h('section.info', 'These are the other participants in this thread. Once a private thread is started you cannot add people to it.')
      )
    ])
    function contactIsTrouble (id) {
      if (id === myId) return false
      if (Array.from(ImFollowing()).includes(id)) return false
      return true
    }

    const composer = api.message.html.compose({
      meta: meta(),
      placeholder: 'Write a reply',
      shrink: false
    })
    const { container, content } = api.app.html.scroller({ prepend: header, append: composer })
    container.classList.add('Thread')
    api.message.async.name(id, (err, name) => {
      if (err) throw err
      container.title = name
    })

    // TODO rewrite with obs
    pull(
      api.sbot.pull.links({ rel: 'root', dest: id, keys: true, old: false }),
      pull.drain(msg => loadThread(), () => {}) // redraw thread
    )

    function loadThread () {
      getThread(id, (err, thread) => {
        if (err) return content.appendChild(h('pre', err.stack))

        // would probably be better keep an id for each message element
        // (i.e. message key) and then update it if necessary.
        // also, it may have moved (say, if you received a missing message)
        content.innerHTML = ''

        // decrypt
        if (thread.some(isEncrypted)) isPrivate.set(true)
        thread = thread.map(decrypt)

        sort(thread)
          .map(api.message.html.render)
          .filter(Boolean)
          .forEach(el => content.appendChild(el))

        const branches = sort.heads(thread)
        meta.branch.set(branches.length > 1 ? branches : branches[0])

        const { content: someContent, author: someAuthor } = thread[0].value
        const { root, channel, recps } = someContent 
        meta.root.set(root || thread[0].key)
        meta.channel.set(channel)

        if (channel) {
          const channelInput = composer.querySelector('input')
          channelInput.value = `#${channel}`
          channelInput.disabled = true
        }

        if (isPrivate()) {
          if (recps) meta.recps.set(recps)
          else meta.recps.set([someAuthor, api.keys.sync.id()])
        }
      })
    }

    loadThread()

    return container
  }

  function decrypt (msg) {
    return isEncrypted(msg)
      ? api.message.sync.unbox(msg)
      : msg
  }

  function getThread (root, cb) {
    // in this case, it's inconvienent that panel only takes
    // a stream. maybe it would be better to accept an array?

    api.sbot.async.get(root, (err, value) => {
      if (err) return cb(err)

      var msg = { key: root, value }
      // if (value.content.root) return getThread(value.content.root, cb)

      pull(
        api.sbot.pull.links({ rel: 'root', dest: root, values: true, keys: true }),
        pull.collect((err, ary) => {
          if (err) return cb(err)
          ary.unshift(msg)

          cb(null, ary)
        })
      )
    })
  }
}

function isEncrypted (msg) {
  return typeof msg.value.content === 'string'
}

