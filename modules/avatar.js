var h = require('hyperscript')
var u = require('../util')
var plugs = require('../plugs')

var avatar_name = plugs.first(exports.avatar_name = [])
var avatar_image = plugs.first(exports.avatar_image = [])
var avatar_link = plugs.first(exports.avatar_link = [])

exports.avatar = function (author, classes) {
  return exports.avatar_image_name_link(author, classes)
}

exports.avatar_image_name_link = function (author, classes) {
  return avatar_link(author, [
    avatar_image(author, classes),
    avatar_name(author)
  ])
}

exports.avatar_image_link = function (author, classes) {
  return avatar_link(author, avatar_image(author, classes))
}

