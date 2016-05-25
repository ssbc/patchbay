var h = require('hyperscript')
var ui = require('../ui')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')
var ref = require('ssb-ref')

exports.message_render = []
exports.message_compose = []
exports.message_unbox = []

function unbox () {
  return pull(
    pull.filter(function (msg) {
      return 'string' == typeof msg.value.content
    }),
    pull.map(function (msg) {
      return u.firstPlug(exports.message_unbox, msg)
    }),
    pull.filter(Boolean)
  )
}

exports.screen_view = function (path, sbot) {
  if(path === '/private') {
    SBOT = sbot
    var content = h('div.column')
    var id = null
    sbot.whoami(function (err, me) {
      id = me.id
    })

    var div = h('div.column', {style: {'overflow':'auto'}},
      u.firstPlug(exports.message_compose, {type: 'post', recps: [], private: true}, 
      function (msg) {
        msg.recps = [id].concat(msg.mentions).filter(function (e) {
          return ref.isFeed('string' === typeof e ? e : e.link)
        })
        if(!msg.recps.length)
          throw new Error('cannot make private message without recipients - just mention them in the message')
        return msg
      },
      sbot),
      content)
    var render = ui.createRenderers(exports.message_render, sbot)

    pull(
      sbot.createLogStream({old: false}),
      unbox(),
      Scroller(div, content, render, true, false)
    )

    pull(
      u.next(sbot.createLogStream, {reverse: true, limit: 1000}),
      unbox(),
      Scroller(div, content, render, false, false, function (err) {
        if(err) throw err
      })
    )

    return div
  }
}




