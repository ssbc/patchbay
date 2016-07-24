var h = require('hyperscript')
var plugs = require('../plugs')

var avatar_image = plugs.first(exports.avatar_image = [])
var avatar_action = plugs.map(exports.avatar_action = [])
var avatar_edit = plugs.first(exports.avatar_edit = [])

exports.avatar_profile = function (id) {
  return avatar_edit(id)

  return h('div.row.profile',
    avatar_image(id),
    h('div.column', avatar_action(id))
  )
}
