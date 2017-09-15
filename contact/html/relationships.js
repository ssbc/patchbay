const nest = require('depnest')
const { h, map, computed, when } = require('mutant')

exports.gives = nest('contact.html.relationships')

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'contact.async.follow': 'first',
  'contact.async.unfollow': 'first',
  'contact.async.block': 'first',
  'contact.async.unblock': 'first',
  'contact.obs.followers': 'first',
  'contact.obs.following': 'first',
  // 'contact.obs.blockers': 'first',
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
      return [...following].filter(follow => followers.includes(follow))
    })
    var following = computed([rawFollowing, friends], (following, friends) => {
      return [...following].filter(follow => !friends.includes(follow))
    })
    var followers = computed([rawFollowers, friends], (followers, friends) => {
      return [...followers].filter(follower => !friends.includes(follower))
    })

    var myId = api.keys.sync.id()
    var ImFollowing = api.contact.obs.following(myId)
    var IFollowThem = computed([ImFollowing], ImFollowing => ImFollowing.includes(id))
    var theyFollowMe = computed([rawFollowing], following => following.includes(myId))

    var relationshipStatus = computed([IFollowThem, theyFollowMe], (IFollowThem, theyFollowMe) => {
      return IFollowThem && theyFollowMe ? '- you are friends'
        : IFollowThem ? '- you follow them'
        : theyFollowMe ? '- they follow you'
        : ''
    })

    function imageLink (id) {
      return h('a',
        { href: id, title: computed(api.about.obs.name(id), name => '@' + name) },
        api.about.html.image(id)
      )
    }

    const { unfollow, follow, block, unblock } = api.contact.async
    // const blockedBy = api.contact.obs.blockers(id)
    // const ImBlockingThem = computed(blockedBy, blockers => blockers.has(myId))

    return h('Relationships', [
      h('header', 'Relationships'),
      when(id !== myId,
        h('div.your-status', [
          h('header', 'Your status'),
          h('section -friendship', [
            when(ImFollowing.sync,
              when(IFollowThem,
                h('button', { 'ev-click': () => unfollow(id) }, 'Unfollow'),
                h('button', { 'ev-click': () => follow(id) }, 'Follow')
              ),
              h('button', { disabled: 'disabled' }, 'Loading...')
            ),
            when(ImFollowing.sync, h('div.relationship-status', relationshipStatus)),
          ]),
          h('section -blocking', [
            // when(ImBlockingThem,
            //   h('button', { 'ev-click': () => unblock(id, console.log) }, 'unblock'),
            //   h('button', { 'ev-click': () => block(id, console.log) }, 'BLOCK')
            // ),
            h('div.explainer', [
              "Blocking is a way to tell others that you don't want to communicate with a person ",
              "(you don't want to hear from them, and you don't want them to hear about you)."
            ])
          ])
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
