
var h = require('hyperscript')
var u = require('../util')

exports.avatar_name = []
exports.avatar_image = []

exports.avatar = function (author, sbot) {
  return h('a.avatar',
    {href:'#'+author},
    u.firstPlug(exports.avatar_image, author, sbot),
    u.firstPlug(exports.avatar_name, author, sbot)
  )
}

