var h = require('hyperscript')
var u = require('../util')
var avatar = require('../plugs').first(exports.avatar = [])
var pull = require('pull-stream')
var plugs = require('../plugs')

//render a message when someone follows someone,
//so you see new users
function isRelated(value, name) {
  return value ? name : value === false ? 'un'+name : ''
}

exports.message_content = function (msg) {

  var content = msg.value.content
  if(content.type == 'contact' && content.contact) {
    var relation = isRelated(content.following, 'follows')
    if(content.blocking) relation = 'blocks'
    return h('div.contact', relation, avatar(msg.value.content.contact, 'thumbnail'))
  }
}

var message_confirm = plugs.first(exports.message_confirm = [])
var follower_of = plugs.first(exports.follower_of = [])

exports.avatar_action = function (id) {
  var follows_you, you_follow

  var self_id = require('../keys').id
  follower_of(self_id, id, function (err, f) {
    you_follow = f
    update()
  })
  follower_of(id, self_id, function (err, f) {
    follows_you = f
    update()
  })

  var state = h('label')
  var label = h('label')

  function update () {
    state.textContent = (
      follows_you && you_follow ? 'friend'
    : follows_you               ? 'follows you'
    : you_follow                ? 'you follow'
    :                             ''
    )

    label.textContent = you_follow ? 'unfollow' : 'follow'
  }

  return h('div', state,
    h('a', {href:'#', onclick: function () {
      message_confirm({
        type: 'contact',
        contact: id,
        following: !you_follow
      }, function (err) {
        //TODO: update after following.
      })
    }}, h('br'), label)
  )
}




