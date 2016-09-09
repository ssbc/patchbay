
var getAvatar = require('ssb-avatar')
var h = require('hyperscript')
var ref = require('ssb-ref')
var path = require('path')

var plugs = require('../plugs')
var sbot_query = plugs.first(exports.sbot_query = [])
var blob_url = require('../plugs').first(exports.blob_url = [])

var pull = require('pull-stream')

var id = require('../keys').id

var default_avatar = path.join(__dirname, 'avatar_fallback.png')

var avatars = AVATARS = {}

function isFunction (f) {
  return 'function' === typeof f
}

var self_id = require('../keys').id

var ready = false
var waiting = []

var last = 0

//blah blah
exports.connection_status = function (err) {
  if (err) return
pull(
  sbot_query({
    query: [{
      $filter: {
        timestamp: {$gt: last || 0 },
        value: { content: {
          type: "about",
          about: {$prefix: "@"},
          image: {link: {$prefix: "&"}}
      }}
    }},
    {
      $map: {
        id: ["value", "content", "about"],
        image: ["value", "content", "image", "link"],
        by: ["value", "author"],
        ts: 'timestamp'
    }}],
    live: true
  }),
  pull.drain(function (a) {
    if(a.sync) {
      ready = true
      while(waiting.length) waiting.shift()()
      return
    }
    last = a.ts
    //set image for avatar.
    //overwrite another avatar
    //you picked.
    if(
      //if there is no avatar
        (!avatars[a.id]) ||
      //if i chose this avatar
        (a.by == self_id) ||
      //they chose their own avatar,
      //and current avatar was not chosen by me
        (a.by === a.id && avatars[a.id].by != self_id)
    )
      avatars[a.id] = a

  })
)
}

exports.avatar_image = function (author, classes) {
  classes = classes || ''
  if(classes && 'string' === typeof classes) classes = '.avatar--'+classes

  var img = h('img'+classes, {src: default_avatar})
//  getAvatar({links: sbot_links}, id, author, function (err, avatar) {
//    if (err) return console.error(err)
//    if(ref.isBlob(avatar.image))
//      img.src = blob_url(avatar.image)
//  })

  function go () {
    if(avatars[author]) img.src = blob_url(avatars[author].image)
  }

  if(!ready)
    waiting.push(go)
  else go()

  return img
}








