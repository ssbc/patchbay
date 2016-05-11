
var h = require('hyperscript')
var u = require('../util')

exports.avatar = function (author, sbot) {
  return h('a', {href:'#'}, u.first(exports.avatar_name, function (plug) {
    return plug(author, sbot)
  }))
}

exports.avatar_name = []

