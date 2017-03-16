const nest = require('depnest')
const { h, map, computed, when } = require('mutant')

exports.gives = nest('contact.html.relationships')

exports.needs = nest({
  about: {
    'html.image': 'first',
    'obs.name': 'first'
  },
  contact: {
    async: {
      follow: 'first',
      unfollow: 'first'
    },
    obs: {
      followers: 'first',
      following: 'first'
    }
  },
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest({
    'contact.html.relationships': relationships
  })

  function relationships (id) {
    var rawFollowing = api.contact.obs.following(id)
    var rawFollowers = api.contact.obs.followers(id)

    var friends = computed([rawFollowing, rawFollowers], (following, followers) => {
      return [...following].filter(follow => followers.has(follow))
    })
    var following = computed([rawFollowing, friends], (following, friends) => {
      return [...following].filter(follow => !friends.includes(follow))
    })
    var followers = computed([rawFollowers, friends], (followers, friends) => {
      return [...followers].filter(follower => !friends.includes(follower))
    })

    var myId = api.keys.sync.id()
    var myFollowing = api.contact.obs.following(myId)
    var iFollow = computed([myFollowing], myFollowing => myFollowing.has(id))
    var theyFollow = computed([rawFollowing], following => following.has(myId))

    var relationshipStatus = computed([iFollow, theyFollow], (iFollow, theyFollow) => {
      return iFollow && theyFollow ? '- you are friends'
        : iFollow ? '- you follow them'
        : theyFollow ? '- they follow you'
        : ''
    })

    function imageLink (id) {
      return h('a',
        { href: id, title: computed(api.about.obs.name(id), name => '@' + name) },
        api.about.html.image(id)
      )
    }

    // TOOD - split this into relationships, move top level stuff into Profile
    return h('Relationships', [
      h('header', 'Relationships'),
      when(id !== myId, 
        h('div.your-status', [
          h('header', 'Your status'),
          h('section.action', [
            when(myFollowing.sync, 
              when(iFollow, 
                h('button', { 'ev-click': api.contact.async.unfollow }, 'Unfollow'),
                h('button', { 'ev-click': api.contact.async.follow }, 'Follow')
              ),
              h('button', { disabled: 'disabled' }, 'Loading...')
            ),
          ]),
          when(myFollowing.sync, h('section.status', relationshipStatus))
        ])
      ),
      h('div.friends', [
        h('header', 'Friends'),
        h('section', map(friends, imageLink))
      ]),
      h('div.follows', [
        h('header', 'Follows'),
        h('section', map(following, imageLink))
      ]),
      h('div.followers', [
        h('header', 'Followers'),
        h('section', map(followers, imageLink))
      ])
    ])
  }
}

