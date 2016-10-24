var h = require('hyperscript')
var ui = require('../ui')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')
var ref = require('ssb-ref')

var plugs = require('../plugs')

var message_render = plugs.first(exports.message_render = [])
var message_compose = plugs.first(exports.message_compose = [])
var message_unbox = plugs.first(exports.message_unbox = [])
var sbot_log = plugs.first(exports.sbot_log = [])
var avatar_image_link = plugs.first(exports.avatar_image_link = [])

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
    if(process.title === 'browser')
      return h('div', h('h4', 'Private messages are not supported in the lite client.'))


    var id = require('../keys').id
    var compose = message_compose(
      {type: 'post', recps: [], private: true},
      {
        prepublish: function (msg) {
          msg.recps = [id].concat(msg.mentions).filter(function (e) {
            return ref.isFeed('string' === typeof e ? e : e.link)
          })
          if(!msg.recps.length)
            throw new Error('cannot make private message without recipients - just mention the user in an at reply in the message you send')
          return msg
        },
        placeholder: 'Write a private message'
      }
      )

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

    return div
  }
}

function map(ary, iter) {
  if(Array.isArray(ary)) return ary.map(iter)
}

exports.message_meta = function (msg) {
  if(msg.value.content.recps || msg.value.private)
    return h('span.row', 'PRIVATE', map(msg.value.content.recps, function (id) {
      return avatar_image_link('string' == typeof id ? id : id.link, 'thumbnail')
    }))
}



