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

var plugs = require('../plugs')

var message_render = plugs.first(exports.message_render = [])
var message_compose = plugs.first(exports.message_compose = [])
var message_unbox = plugs.first(exports.message_unbox = [])

var sbot_get = plugs.first(exports.sbot_get = [])
var sbot_links = plugs.first(exports.sbot_links = [])

function getThread (root, cb) {
  //in this case, it's inconvienent that panel only takes
  //a stream. maybe it would be better to accept an array?

  sbot_get(root, function (err, value) {
    var msg = {key: root, value: value}
    if(value.content.root) return getThread(value.content.root, cb)

    pull(
      sbot_links({rel: 'root', dest: root, values: true, keys: true}),
      pull.collect(function (err, ary) {
        if(err) return cb(err)
        ary.unshift(msg)
        cb(null, ary)
      })
    )
  })

//  return pull(Cat([
//    once(function (cb) {
//      sbot_get(root, function (err, value) {
//        cb(err, {key: root, value: value})
//      })
//    }),
//    sbot_links({rel: 'root', dest: root, values: true, keys: true})
//  ]), pull.collect(cb))
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
      h('div.editor', message_compose(meta))
    )

    pull(
      sbot_links({
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
        thread = thread.map(function (msg) {
          return 'string' === typeof msg.value.content ? message_unbox(msg) : msg
        })

        if(err) return content.appendChild(h('pre', err.stack))
        sort(thread).map(message_render).forEach(function (el) {
          content.appendChild(el)
        })

        var branches = sort.heads(thread)
        meta.branch = branches.length > 1 ? branches : branches[0]
        meta.root = thread[0].key

        var recps = thread[0].value.content.recps
        if(recps && thread[0].value.private)
          meta.recps = recps
      })
    }

    loadThread()
    return div
  }
}





