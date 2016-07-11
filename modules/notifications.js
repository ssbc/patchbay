var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')
var paramap = require('pull-paramap')
var plugs = require('../plugs')

var message_render = plugs.first(exports.message_render = [])
var sbot_log = plugs.first(exports.sbot_log = [])
var sbot_whoami = plugs.first(exports.sbot_whoami = [])
var sbot_get = plugs.first(exports.sbot_get = [])
var sbot_user_feed = plugs.first(exports.sbot_user_feed = [])
var message_unbox = plugs.first(exports.message_unbox = [])

function unbox() {
  return pull(
    pull.map(function (msg) {
      return msg.value && 'string' === typeof msg.value.content ?
        message_unbox(msg) : msg
    }),
    pull.filter(Boolean)
  )
}

function notifications(ourIds) {

  function linksToUs(link) {
    return link && link.link in ourIds
  }

  function isOurMsg(id, cb) {
    sbot_get(id, function (err, msg) {
      if (err && err.name == 'NotFoundError') cb(null, false)
      else if (err) cb(err)
      else cb(err, msg.author in ourIds)
    })
  }

  return paramap(function (msg, cb) {
    var c = msg.value && msg.value.content
    if (!c || typeof c !== 'object') return cb()
    if (msg.value.author in ourIds) return cb()

    if (c.mentions && Array.isArray(c.mentions) && c.mentions.some(linksToUs))
      return cb(null, msg)

    if (msg.private)
      return cb(null, msg)

    switch (c.type) {
      case 'post':
        if (c.branch)
          return isOurMsg(c.branch, function (err, isOurs) {
            if (err) cb(err)
            else if (isOurs) cb(null, msg)
            else if (c.root) isOurMsg(c.root, function (err, isOurs) {
              if (err) cb(err)
              else if (isOurs) cb(null, msg)
              else cb()
            })
          })
        else return cb()

      case 'contact':
        return cb(null, c.contact in ourIds ? msg : null)

      case 'vote':
        if (c.vote && c.vote.link)
          return isOurMsg(c.vote.link, function (err, isOurs) {
            cb(err, isOurs ? msg : null)
          })
          else return cb()

      default:
        cb()
    }
  }, 4)
}

function getFirstMessage(feedId, cb) {
  sbot_user_feed({id: feedId, gte: 0, limit: 1})(null, cb)
}

exports.screen_view = function (path) {
  if(path === '/notifications') {
    var ids = {}
    var oldest

    sbot_whoami(function (err, me) {
      if (err) return console.error(err)
      ids[me.id] = true
      getFirstMessage(me.id, function (err, msg) {
        if (err) return console.error(err)
        if (!oldest || msg.value.timestamp < oldest) {
          oldest = msg.value.timestamp
        }
      })
    })

    var content = h('div.column.scroller__content')
    var div = h('div.column.scroller',
      {style: {'overflow':'auto'}},
      h('div.scroller__wrapper',
        content
      )
    )

    pull(
      sbot_log({old: false}),
      unbox(),
      notifications(ids),
      pull.filter(),
      Scroller(div, content, message_render, true, false)
    )

    pull(
      u.next(sbot_log, {reverse: true, limit: 100, live: false}),
      unbox(),
      notifications(ids),
      pull.filter(),
      pull.take(function (msg) {
        // abort stream after we pass the oldest messages of our feeds
        return !oldest || msg.value.timestamp > oldest
      }),
      Scroller(div, content, message_render, false, false)
    )

    return div
  }
}

