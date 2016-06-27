var h = require('hyperscript')
var ui = require('../ui')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')
var keyscroll = require('../keyscroll')
var ref = require('ssb-ref')

var plugs = require('../plugs')

var message_render = plugs.first(exports.message_render = [])
var message_compose = plugs.first(exports.message_compose = [])
var message_unbox = plugs.first(exports.message_unbox = [])
var sbot_log = plugs.first(exports.sbot_log = [])
var sbot_whoami = plugs.first(exports.sbot_whoami = [])

function unbox () {
  return pull(
    pull.filter(function (msg) {
      return 'string' == typeof msg.value.content
    }),
    pull.map(function (msg) {
      return message_unbox(msg)
    }),
    pull.filter(Boolean)
  )
}

exports.screen_view = function (path) {
  if(path === '/private') {
    var id = null
    sbot_whoami(function (err, me) {
      id = me.id
    })

    var div = h('div.column.scroller',
      {style: {'overflow':'auto'}},
      h('div.scroller__wrapper',
        message_compose({type: 'post'}), //header
        content
      )
    )

    var compose = message_compose(
      {type: 'post', recps: [], private: true}, 
      function (msg) {
        msg.recps = [id].concat(msg.mentions).filter(function (e) {
          return ref.isFeed('string' === typeof e ? e : e.link)
        })
        if(!msg.recps.length)
          throw new Error('cannot make private message without recipients - just mention them in the message')
        return msg
      })

    var content = h('div.column.scroller__content')
    var div = h('div.column.scroller',
      {style: {'overflow':'auto'}},
      h('div.scroller__wrapper', compose, content)
    )

    pull(
      sbot_log({old: false}),
      unbox(),
      Scroller(div, content, message_render, true, false)
    )

    pull(
      u.next(sbot_log, {reverse: true, limit: 1000}),
      unbox(),
      Scroller(div, content, message_render, false, false, function (err) {
        if(err) throw err
      })
    )

    div.scroll = keyscroll(content)

    return div
  }
}

exports.message_meta = function (msg) {
  if(msg.value.private)
    return "PRIVATE"
}










