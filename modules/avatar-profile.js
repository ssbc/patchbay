var h = require('hyperscript')
var plugs = require('../plugs')

var avatar_image = plugs.first(exports.avatar_image = [])
var avatar_action = plugs.map(exports.avatar_action = [])

exports.avatar_profile = function (id) {

  return h('div.row',
    avatar_image(id),
    h('div.column', avatar_action(id))
  )
}
