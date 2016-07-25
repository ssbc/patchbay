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
    var relation = content.following ? 'follows' : 'unfollows'
    return h('div.contact', [
        isRelated(content.following, 'follows'),
        isRelated(content.blocking, 'blocks')
      ].filter(Boolean).join(' and ')
      , avatar(msg.value.content.contact, 'thumbnail')
    )
  }
}

var sbot_links2 = plugs.first(exports.sbot_links2 = [])
var message_confirm = plugs.first(exports.message_confirm = [])

function follows (source, dest, cb) {
  pull(
    sbot_links2({query:[
      {$filter: {
        source: source,
        dest: dest,
        rel: ['contact', {$gt: null}]
      }},
      {$map: {
        timestamp: 'timestamp', follows: ["rel", 1]
      }}
    ]}),
    pull.collect(function (err, ary) {
      if(err) return cb(err)
      cb(null,
        ary.length ? ary.sort(function (a, b) {
          return a.timestamp - b.timestamp
        }).pop().follows : false
      )
    })
  )
}

exports.avatar_action = function (id) {
  var follows_you, you_follow

  var self_id = require('../keys').id
  follows(self_id, id, function (err, f) {
    you_follow = f
    update()
  })
  follows(id, self_id, function (err, f) {
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















