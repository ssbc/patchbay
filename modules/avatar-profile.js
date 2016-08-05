var h = require('hyperscript')
var plugs = require('../plugs')
var pull = require('pull-stream')

var avatar_image_link = plugs.first(exports.avatar_image_link = [])
var avatar_action = plugs.map(exports.avatar_action = [])
var avatar_edit = plugs.first(exports.avatar_edit = [])

var follows = plugs.first(exports.follows = [])
var followers = plugs.first(exports.followers = [])

function streamToList(stream, el) {
  pull(
    stream,
    pull.drain(function (item) {
      if(item) el.appendChild(item)
    })
  )
  return el
}

function image_link (id) {
  return avatar_image_link(id, 'thumbnail')
}

exports.avatar_profile = function (id) {
  return h('div.column.profile',
    avatar_edit(id),
    avatar_action(id),

      h('div.profile__relationships.column',

        h('strong', 'follows'),
        streamToList(pull(
          follows(id),
          pull.unique(),
          pull.map(image_link)
        ), h('div.profile__follows.wrap')),

       h('strong', 'followers'),
        streamToList(pull(
          followers(id),
          pull.unique(),
          pull.map(image_link)
        ), h('div.profile__followers.wrap'))
      )
  )
}





