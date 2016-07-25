var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')
var paramap = require('pull-paramap')
var plugs = require('../plugs')
var cont = require('cont')

var message_render = plugs.first(exports.message_render = [])
var sbot_log = plugs.first(exports.sbot_log = [])
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
        if (c.branch || c.root)
          cont.para([].concat(c.branch, c.root).map(function (id) {
            return function (cb) { isOurMsg(id, cb) }
          }))
          (function (err, results) {
            if (err) cb(err)
            else if (results.some(Boolean)) cb(null, msg)
            else cb()
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

      case 'issue':
      case 'pull-request':
        return isOurMsg(c.project || c.repo, function (err, isOurs) {
          cb(err, isOurs ? msg : null)
        })

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

    var id = require('../keys').id
    ids[id] = true
    getFirstMessage(id, function (err, msg) {
      if (err) return console.error(err)
      if (!oldest || msg.value.timestamp < oldest) {
        oldest = msg.value.timestamp
      }
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




