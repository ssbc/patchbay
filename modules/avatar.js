
var h = require('hyperscript')
var u = require('../util')

exports.avatar = function (author, sbot) {
  return h('a',
    {href:'#'+author},
    u.firstPlug(exports.avatar_name, author, sbot)
  )
}

exports.avatar_name = []


