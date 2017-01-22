const fs = require('fs')
const h = require('../h')

//render a message when someone follows someone,
//so you see new users
function isRelated(value, name) {
  return value ? name : value === false ? 'un'+name : ''
}

exports.needs = {
  avatar: 'first',
  avatar_name: 'first',
  avatar_link: 'first',
  message_confirm: 'first',
  follower_of: 'first'
}

exports.gives = {
  message_content: true,
  message_content_mini: true,
  avatar_action: true,
  mcss: true
}

exports.create = function (api) {
  return {
    message_content_mini,
    message_content,
    avatar_action,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function message_content_mini (msg) {
    const { type, contact, following, blocking } = msg.value.content
    if(type == 'contact' && contact) {
      var relation = isRelated(following, 'follows')
      if(blocking) relation = 'blocks'
      return [
        relation,
        ' ',
        api.avatar_link(contact, api.avatar_name(contact), '')
      ]
    }
  }

  function message_content (msg) {
    const { type, contact, following, blocking } = msg.value.content
    if(type == 'contact' && contact) {
      var relation = isRelated(following, 'follows')
      if(blocking) relation = 'blocks'
      return h('div.contact', [
        relation, 
        api.avatar(contact, 'thumbnail')
      ])
    }
  }

  function avatar_action (id) {
    var follows_you, you_follow

    var self_id = require('../keys').id
    api.follower_of(self_id, id, (err, f) => {
      you_follow = f
      update()
    })
    api.follower_of(id, self_id, (err, f) => {
      follows_you = f
      update()
    })

    var followBtn = h('button', { 'ev-click': toggleFollow }, 'loading')
    var state = h('label', 'loading')

    function update () {
      state.textContent = (
        follows_you && you_follow ? 'you are friends'
      : follows_you               ? 'follows you'
      : you_follow                ? 'you follow'
      :                             ''
      )
      
      if (you_follow === undefined) return 
      followBtn.textContent = you_follow ? 'unfollow' : 'follow'
    }

    return h('Follow', [
      followBtn,
      state
    ])

    function toggleFollow () {
      if (followBtn.textContent === 'loading') return
      const msg = {
        type: 'contact',
        contact: id,
        following: !you_follow
      }

      api.message_confirm(msg, (err, msg) => {
        if (err) return console.error(err)

        you_follow = msg.value.content.following
        update()
      })
    }
    
  }
  return exports
}
