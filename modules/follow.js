var h = require('hyperscript')
var u = require('../util')
var avatar = require('../plugs').first(exports.avatar = [])
var pull = require('pull-stream')
var plugs = require('../plugs')

//render a message when someone follows someone,
//so you see new users
exports.message_content = function (msg) {

  if(msg.value.content.type == 'contact') {
    return h('div.contact',
      'follows',
      avatar(msg.value.content.contact)
    )
  }
}

var sbot_links2 = plugs.first(exports.sbot_links2 = [])
var sbot_whoami = plugs.first(exports.sbot_whoami = [])
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

  sbot_whoami(function (err, me) {
    follows(me.id, id, function (err, f) {
      you_follow = f
      update()
    })
    follows(id, me.id, function (err, f) {
      follows_you = f
      update()
    })
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
    }}, label)
  )
}



