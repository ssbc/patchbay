
var getAvatar = require('ssb-avatar')
var h = require('hyperscript')
var ref = require('ssb-ref')

exports.avatar_image = function (author, sbot) {
  var img = h('img', {src: 'http://localhost:7777/img/fallback.png'})
  sbot.whoami(function (err, me) {
    getAvatar(sbot, me.id, author, function (err, avatar) {
      if(ref.isBlob(avatar.image))
        img.src = 'http://localhost:7777/'+encodeURIComponent(avatar.image)
    })
  })
  return img
}

