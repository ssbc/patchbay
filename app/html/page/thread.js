var { h } = require('mutant')
const nest = require('depnest')
const pull = require('pull-stream')
const sort = require('ssb-sort')
const ref = require('ssb-ref')

exports.gives = nest('app.html.page')

// TODO - seperate out public and private thread rendering
exports.needs = nest({
  // 'feed.pull.public': 'first',
  'keys.sync.id': 'first',
  'app.html.scroller': 'first',
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
    if (!ref.isMsg(id)) return

    var meta = {
      type: 'post',
      root: id,
      branch: id // mutated when thread is loaded.
    }
    const composer = api.message.html.compose({
      meta,
      placeholder: 'Write a reply',
      shrink: false
    })
    const { container, content } = api.app.html.scroller({ append: composer })
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
        thread = thread.map(msg => {
          return typeof msg.value.content === 'string'
            ? api.message.sync.unbox(msg)
            : msg
        })

        sort(thread)
          .map(api.message.html.render)
          .filter(Boolean)
          .forEach(el => content.appendChild(el))

        var branches = sort.heads(thread)
        meta.branch = branches.length > 1 ? branches : branches[0]
        meta.root = thread[0].value.content.root || thread[0].key
        meta.channel = thread[0].value.content.channel

        if (meta.channel) {
          const channelInput = composer.querySelector('input')
          channelInput.value = `#${meta.channel}`
          channelInput.disabled = true
        }

        const priv = thread[0].value['private']
        const recps = thread[0].value.content.recps
        if (priv) {
          if (recps) meta.recps = recps
          else meta.recps = [thread[0].value.author, api.keys.sync.id()]
        }
      })
    }

    loadThread()

    return container
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

