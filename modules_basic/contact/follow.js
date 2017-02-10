const fs = require('fs')
const h = require('../../h')
const self_id = require('../../keys').id

//render a message when someone follows someone,
//so you see new users
function isRelated(value, name) {
  return value ? name : value === false ? 'un'+name : ''
}

exports.needs = {
  about: {
    image_name_link: 'first',
    name: 'first',
    link: 'first',
  },
  message: { confirm: 'first' },
  contact: { follower_of: 'first' }
}

exports.gives = {
  message: {
    content: true,
    content_mini: true
  },
  contact: { action: true }
}

exports.create = function (api) {
  return {
    message: {
      content_mini,
      content
    },
    contact: {
      action
    }
  }

  function content_mini (msg) {
    const { type, contact, following, blocking } = msg.value.content
    if(type == 'contact' && contact) {
      var relation = isRelated(following, 'follows')
      if(blocking) relation = 'blocks'
      return [
        relation,
        ' ',
        api.about.link(contact, api.about.name(contact), '')
      ]
    }
  }

  function content (msg) {
    const { type, contact, following, blocking } = msg.value.content
    if(type == 'contact' && contact) {
      var relation = isRelated(following, 'follows')
      if(blocking) relation = 'blocks'
      return h('div.contact', [
        relation,
        api.about.name_link(contact, 'thumbnail')
      ])
    }
  }

  function action (id) {
    var follows_you, you_follow

    api.contact.follower_of(self_id, id, (err, f) => {
      you_follow = f || false
      update()
    })
    api.contact.follower_of(id, self_id, (err, f) => {
      follows_you = f || false
      update()
    })

    var followBtn = h('button', { 'ev-click': toggleFollow }, 'loading')
    var state = h('label', 'loading')

    function update () {
      state.textContent = (
        follows_you && you_follow ? '- you are friends'
      : follows_you               ? '- they follow you'
      : you_follow                ? '- you are following'
      :                             ''
      )

      // wait till finished loading before offering follow options
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

      api.message.confirm(msg, (err, msg) => {
        if (err) return console.error(err)

        you_follow = !you_follow
        update()
      })
    }

  }
  return exports
}
