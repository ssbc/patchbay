const nest = require('depnest')
const { h, map, computed } = require('mutant')

exports.gives = nest('contact.html.relationships')

exports.needs = nest({
  about: {
    'html.image': 'first',
    'obs.name': 'first'
  },
  contact: {
    obs: {
      followers: 'first',
      following: 'first'
    }
    // TODO add following
  }
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

    function imageLink (id) {
      return h('a',
        { href: id, title: computed(api.about.obs.name(id), name => '@' + name) },
        api.about.html.image(id)
      )
    }

    // TOOD - split this into relationships, move top level stuff into Profile
    return h('Relationships', [
      h('header', 'Relationships'),
      h('div.your-status', [
        h('header', 'Your status')
        // h('section.action', api.contact.action(id))
      ]),
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

