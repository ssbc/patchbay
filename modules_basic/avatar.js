var h = require('hyperscript')
var u = require('../util')

exports.needs = {
  avatar_name: 'first',
  avatar_image: 'first',
  avatar_link: 'first'
}

exports.gives = {
  avatar: true,
  avatar_image_name_link: true,
  avatar_image_link: true
}

exports.create = function (api) {

  var exports = {}
  exports.avatar = function (author, classes) {
    return exports.avatar_image_name_link(author, classes)
  }

  exports.avatar_image_name_link = function (author, classes) {
    return api.avatar_link(author, [
      api.avatar_image(author, classes),
      api.avatar_name(author)
    ])
  }

  exports.avatar_image_link = function (author, classes) {
    return api.avatar_link(author, api.avatar_image(author, classes))
  }

  return exports
}


