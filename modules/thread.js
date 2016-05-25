var ui = require('../ui')
var pull = require('pull-stream')
var Cat = require('pull-cat')
var sort = require('ssb-sort')
var ref = require('ssb-ref')
var h = require('hyperscript')
var u = require('../util')
var Scroller = require('pull-scroll')

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

function getThread (root, sbot, cb) {
  //in this case, it's inconvienent that panel only takes
  //a stream. maybe it would be better to accept an array?

  return pull(Cat([
    once(function (cb) {
      sbot.get(root, function (err, value) {
        cb(err, {key: root, value: value})
      })
    }),
    sbot.links({rel: 'root', dest: root, values: true, keys: true})
  ]), pull.collect(cb))
}

function unbox(msg) {
  return u.firstPlug(exports.message_unbox, msg)
}

exports.screen_view = function (id, sbot) {
  if(ref.isMsg(id)) {
    var meta = {
      type: 'post',
      root: id,
      branch: id //mutated when thread is loaded.
    }

    var content = h('div')
    var div = h('div.column',
      {style: {'overflow-y': 'auto'}},
      content,
      h('div.editor', u.firstPlug(exports.message_compose, meta, sbot))
    )

    var render = ui.createRenderers(exports.message_render, sbot)

    pull(
      sbot.links({
        rel: 'root', dest: id, keys: true, old: false
      }),
      pull.drain(function (msg) {
        console.log('new message in thread', msg)
        //redraw thread
        loadThread()
      }, function () {} )
    )


    function loadThread () {
      console.log("LOAD THREAD", id)
      getThread(id, sbot, function (err, thread) {
        //would probably be better keep an id for each message element
        //(i.e. message key) and then update it if necessary.
        //also, it may have moved (say, if you received a missing message)
        content.innerHTML = ''
        thread = thread.map(function (msg) {
          return 'string' === typeof msg.value.content ? unbox(msg) : msg
        })

        if(err) return content.appendChild(h('pre', err.stack))
        sort(thread).map(render).forEach(function (el) {
          content.appendChild(el)
        })

        var branches = sort.heads(thread)
        meta.branch = branches.length > 1 ? branches : branches[0]

        var recps = thread[0].value.content.recps
        if(recps && thread[0].value.private)
          meta.recps = recps
      })

    }

    loadThread()

    return div
  }

}

exports.message_render = []
exports.message_compose = []
exports.message_unbox = []


















