const fs = require('fs')
const h = require('../../h')
const pull = require('pull-stream')
const { unique, drain } = pull
const {
  Array: MutantArray,
  map, computed, when, dictToCollection
} = require('@mmckegg/mutant')


exports.needs = {
  avatar_image_link: 'first',
  avatar_action: 'map',
  avatar_edit: 'first',
  follows: 'first',
  followers: 'first'
}

exports.gives = {
  avatar_profile: true,
  mcss: true
}

exports.create = function (api) {
  return { 
    avatar_profile,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function avatar_profile (id) {

    var rawFollows = MutantArray()
    var rawFollowers = MutantArray()
    var friends = computed([rawFollows, rawFollowers], (follows, followers) => {
      return follows.filter(follow => followers.includes(follow))
    })

    var follows = computed([rawFollows, friends], (follows, friends) => {
      return follows.filter(follow => !friends.includes(follow))
    })
    var followers = computed([rawFollowers, friends], (followers, friends) => {
      return followers.filter(follower => !friends.includes(follower))
    })

    pull(
      api.follows(id),
      unique(), 
      drain(
        peer => rawFollows.push(peer), 
        (err, data) => console.log('follows drain done', err, data)
      )
    )
    pull(
      api.followers(id),
      unique(), 
      drain(
        peer => rawFollowers.push(peer), 
        (err, data) => console.log('followers drain done', err, data)
      )
    )

    return h('Profile', [
      h('section.edit', api.avatar_edit(id)),
      h('section.relationships', [
        h('header', 'Relationships'),
        h('div.your-status', [
          h('header', 'Your status'),
          h('section.action', api.avatar_action(id))
        ]),
        h('div.friends', [
          h('header', 'Friends'),
          h('section', map(friends, id => api.avatar_image_link(id)))
        ]),
        h('div.follows', [
          h('header', 'Follows'),
          h('section', map(follows, id => api.avatar_image_link(id)))
        ]),
        h('div.followers', [
          h('header', 'Followers'),
          h('section', map(followers, id => api.avatar_image_link(id)))
        ])
      ])
    ])
  }

}
