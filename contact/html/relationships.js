const nest = require('depnest')
const { h, map, computed, when, Value } = require('mutant')

exports.gives = nest('contact.html.relationships')

exports.needs = nest({
  // 'about.html.image': 'first',
  'about.html.avatar': 'first',
  // 'about.obs.name': 'first',
  'contact.async.follow': 'first',
  'contact.async.unfollow': 'first',
  'contact.async.block': 'first',
  'contact.async.unblock': 'first',
  'contact.obs.followers': 'first',
  'contact.obs.following': 'first',
  'contact.obs.blockers': 'first',
  'contact.obs.blocking': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest({
    'contact.html.relationships': relationships
  })

  function relationships (feedId) {
    const rawFollowing = api.contact.obs.following(feedId)
    const rawFollowers = api.contact.obs.followers(feedId)

    // mix: TODO rework this
    const friends = computed([rawFollowing, rawFollowers], (following, followers) => {
      return [...following].filter(follow => followers.includes(follow))
    })
    const following = computed([rawFollowing, friends], (following, friends) => {
      return [...following].filter(follow => !friends.includes(follow))
    })
    const followers = computed([rawFollowers, friends], (followers, friends) => {
      return [...followers].filter(follower => !friends.includes(follower))
    })
    const blockers = api.contact.obs.blockers(feedId)
    const blocking = api.contact.obs.blocking(feedId)

    const modes = [
      { label: 'Friends', data: friends },
      { label: 'Follows', data: following },
      { label: 'Followers', data: followers },
      { label: 'Blocked by', data: blockers, hideEmpty: true },
      { label: 'Blocking', data: blocking, hideEmpty: true }
    ]
    const mode = Value(0)
    const setMode = (i) => {
      if (mode() === i) mode.set()
      else mode.set(i)
    }

    const avatar = api.about.html.avatar

    return h('Relationships', [
      h('header', 'Relationships'),
      RelationshipStatus({ feedId, rawFollowing, blockers, api }),

      h('div.groups', [
        h('div.tabs', modes.map(({ label, data, hideEmpty }, i) => {
          return computed([data, mode], (d, mode) => {
            if (hideEmpty && !d.length) return

            return h('div.tab',
              {
                className: mode === i ? '-active' : '',
                'ev-click': () => setMode(i)
              },
              [
                h('div.label', label),
                h('div.count', d.length > 50 ? '50+' : d.length)
              ]
            )
          })
        })),
        h('div.group', computed(mode, i => {
          if (i === null) return

          const { data } = modes[i]
          return map(data, avatar)
        }))
      ])
    ])
  }
}

function RelationshipStatus ({ feedId, rawFollowing, blockers, api }) {
  const myId = api.keys.sync.id()
  if (feedId === myId) return

  // mix: TODO oh lord this is ugly, refactor it !
  const ImFollowing = api.contact.obs.following(myId)
  const IFollowThem = computed([ImFollowing], ImFollowing => ImFollowing.includes(feedId))
  const theyFollowMe = computed([rawFollowing], following => following.includes(myId))
  const ImBlockingThem = computed(blockers, blockers => blockers.includes(myId))

  const relationshipStatus = computed([IFollowThem, theyFollowMe], (IFollowThem, theyFollowMe) => {
    return IFollowThem && theyFollowMe ? '- you are friends'
      : IFollowThem ? '- you follow them'
        : theyFollowMe ? '- they follow you'
          : ''
  })
  const { unfollow, follow, block, unblock } = api.contact.async

  return h('div.relationship-status', [
    h('section -friendship', [
      when(ImFollowing.sync,
        when(IFollowThem,
          h('button', { 'ev-click': () => unfollow(feedId) }, 'Unfollow'),
          h('button', { 'ev-click': () => follow(feedId) }, 'Follow')
        ),
        h('button', { disabled: 'disabled' }, 'Loading...')
      ),
      when(ImFollowing.sync, h('div.relationship-status', relationshipStatus))
    ]),
    h('section -blocking', [
      when(ImBlockingThem,
        h('button -subtle', { 'ev-click': () => unblock(feedId, console.log) }, [ h('i.fa.fa-ban'), 'unblock' ]),
        h('button -subtle', { 'ev-click': () => block(feedId, console.log) }, [ h('i.fa.fa-ban'), 'BLOCK' ])
      ),
      h('div.explainer', [
        "Blocking tells everyone you don't want to communicate with a person.",
        h('ul', [
          h('li', 'You will no longer receive messages from this person'),
          h('li', "This person won't get any new information about you (including this block)"),
          h('li', "Your followers will see you have blocked this person - their apps need to know so that they don't pass your information on.")
        ])
      ])
    ])
  ])
}
