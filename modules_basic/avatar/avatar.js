var h = require('hyperscript')
var u = require('../../util')

exports.needs = {
  avatar_name: 'first',
  avatar_image: 'first',
  avatar_link: 'first'
}

exports.gives = {
  avatar: true,
  avatar_image_name_link: true,
  avatar_image_link: true,
  avatar_name_link: true
}

exports.create = function (api) {
  return {
    avatar,
    avatar_image_name_link,
    avatar_image_link,
    avatar_name_link
  }

  function avatar (author, classes) {
    return exports.avatar_image_name_link(author, classes)
  }

  function avatar_image_name_link (author, classes) {
    return api.avatar_link(author, [
      api.avatar_image(author, classes),
      api.avatar_name(author)
    ])
  }

  function avatar_image_link (author, classes) {
    return api.avatar_link(author, api.avatar_image(author, classes))
  }

  function avatar_name_link (author, classes) {
    return api.avatar_link(author, api.avatar_name(author))
  }
}


