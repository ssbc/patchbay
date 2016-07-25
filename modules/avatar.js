var h = require('hyperscript')
var u = require('../util')


var plugs = require('../plugs')
var avatar_name = plugs.first(exports.avatar_name = [])
var avatar_image = plugs.first(exports.avatar_image = [])

exports.avatar = function (author, classes) {
  return h('a.avatar',
    {href:'#'+author},
    avatar_image(author, classes),
    avatar_name(author)
  )
}

