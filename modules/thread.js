var ui = require('../ui')
var pull = require('pull-stream')
var Cat = require('pull-cat')
var Sort = require('pull-sort')
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

function threadStream (root, sbot ) {
  //in this case, it's inconvienent that panel only takes
  //a stream. maybe it would be better to accept an array?

  return pull(
    Cat([
      once(function (cb) {
        sbot.get(root, function (err, value) {
          cb(err, {key: root, value: value})
        })
      }),
      sbot.links({rel: 'root', dest: root, values: true, keys: true})
    ]),
    Sort(function (a, b) {
      //THIS IS WRONG AND HAS KNOWN BUGS!!!
      //TODO: sort by cryptographic causal ordering.
      return a.value.timestamp - b.value.timestamp
    })
  )
}

exports.screen_view = function (id, sbot) {
  if(ref.isMsg(id)) {
    var content = h('div.column')
    var div = h('div.column', {style: {'overflow':'auto'}},
      h('div', content),
      u.decorate(exports.message_compose, {root: id}, function (d, e, v) {
        return d(e, v, sbot)
      })
    )
    var render = ui.createRenderers(exports.message_render, sbot)

    pull(
      threadStream(id, sbot),
      Scroller(div, content, render, false, false)
    )

    return div
  }

    return ui.createStream(
      ui.createRenderers(exports.message_render, sbot)
    )
}

exports.message_render = []
exports.message_compose = []








