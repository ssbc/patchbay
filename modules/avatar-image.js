
var getAvatar = require('ssb-avatar')
var h = require('hyperscript')
var ref = require('ssb-ref')

var plugs = require('../plugs')
var sbot_whoami = plugs.first(exports.sbot_whoami = [])
var sbot_links = plugs.first(exports.sbot_links = [])

exports.avatar_image = function (author) {
  var img = h('img', {src: 'http://localhost:7777/img/fallback.png'})
  sbot_whoami(function (err, me) {
    getAvatar({links: sbot_links}, me.id, author, function (err, avatar) {
      if(ref.isBlob(avatar.image))
        img.src = 'http://localhost:7777/'+encodeURIComponent(avatar.image)
    })
  })
  return img
}


