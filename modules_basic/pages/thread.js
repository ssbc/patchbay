var pull = require('pull-stream')
var sort = require('ssb-sort')
var ref = require('ssb-ref')
var h = require('hyperscript')
var self_id = require('../../keys').id

function once (cont) {
  var ended = false
  return function (abort, cb) {
    if(abort) return cb(abort)
    else if (ended) return cb(ended)
    else
      cont(function (err, data) {
        if(err) return cb(ended = err)
        ended = true
        cb(null, data)
      })
  }
}

exports.needs = {
  helpers: { build_scroller: 'first', },
  message: {
    render: 'first',
    name: 'first',
    compose: 'first',
    unbox: 'first'
  },
  sbot: {
    get: 'first',
    links: 'first'
  }
}

exports.gives = 'screen_view'

exports.create = function (api) {

  function getThread (root, cb) {
    //in this case, it's inconvienent that panel only takes
    //a stream. maybe it would be better to accept an array?

    api.sbot.get(root, function (err, value) {
      if (err) return cb(err)
      var msg = {key: root, value: value}
  //    if(value.content.root) return getThread(value.content.root, cb)

      pull(
        api.sbot.links({rel: 'root', dest: root, values: true, keys: true}),
        pull.collect(function (err, ary) {
          if(err) return cb(err)
          ary.unshift(msg)
          cb(null, ary)
        })
      )
    })

  }

  return function (id) {
    if(ref.isMsg(id)) {
      var meta = {
        type: 'post',
        root: id,
        branch: id //mutated when thread is loaded.
      }

      var composer = api.message.compose(meta, {shrink: false, placeholder: 'Write a reply'})
      var { container, content } = api.helpers.build_scroller({ append: composer })

      api.message.name(id, function (err, name) {
        container.title = name
      })

      pull(
        api.sbot.links({
          rel: 'root', dest: id, keys: true, old: false
        }),
        pull.drain(function (msg) {
          loadThread() //redraw thread
        }, function () {} )
      )


      function loadThread () {
        getThread(id, function (err, thread) {
          //would probably be better keep an id for each message element
          //(i.e. message key) and then update it if necessary.
          //also, it may have moved (say, if you received a missing message)
          content.innerHTML = ''
          if(err) return content.appendChild(h('pre', err.stack))

          //decrypt
          thread = thread.map(function (msg) {
            return 'string' === typeof msg.value.content ? api.message.unbox(msg) : msg
          })

          if(err) return content.appendChild(h('pre', err.stack))
          sort(thread).map(api.message.render).filter(Boolean).forEach(function (el) {
            content.appendChild(el)
          })

          var branches = sort.heads(thread)
          meta.branch = branches.length > 1 ? branches : branches[0]
          meta.root = thread[0].value.content.root || thread[0].key
          meta.channel = thread[0].value.content.channel

          if (meta.channel) {
            const channelInput = composer.querySelector('input')
            channelInput.value = `#${meta.channel}`
            channelInput.disabled = true
          }

          var recps = thread[0].value.content.recps
          var priv = thread[0].value['private']
          if(priv) {
            if(recps)
              meta.recps = recps
            else
              meta.recps = [thread[0].value.author, self_id]
          }
        })
      }

      loadThread()
      return container
    }
  }
}
