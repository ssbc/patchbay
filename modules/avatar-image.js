
var getAvatar = require('ssb-avatar')
var h = require('hyperscript')
var ref = require('ssb-ref')

var plugs = require('../plugs')
var sbot_links = plugs.first(exports.sbot_links = [])
var blob_url = require('../plugs').first(exports.blob_url = [])

var id = require('../keys').id

var default_avatar = '&qjeAs8+uMXLlyovT4JnEpMwTNDx/QXHfOl2nv2u0VCM=.sha256'

exports.avatar_image = function (author, classes) {
  classes = classes || ''
  if(classes && 'string' === typeof classes) classes = '.avatar--'+classes

  var img = h('img'+classes, {src: blob_url(default_avatar)})
  getAvatar({links: sbot_links}, id, author, function (err, avatar) {
    if (err) return console.error(err)
    if(ref.isBlob(avatar.image))
      img.src = blob_url(avatar.image)
  })
  return img
}








