const nest = require('depnest')
const { h, Value, computed } = require('mutant')

const Connections = require('./connections')
const ReplicationIn = require('./replication-in')
const ReplicationOut = require('./replication-out')
const InvitePub = require('./invite-pub')
const InvitePeer = require('./invite-peer')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.network': true
})

exports.needs = nest({
  'about.html.avatar': 'first',
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
  'sbot.obs.connection': 'first',
  'sbot.obs.localPeers': 'first',
  'sbot.obs.connectedPeers': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.network': networkPage
  })

  function menuItem () {
    return h('a', {
      'ev-click': () => api.app.sync.goTo({ page: 'network' })
    }, '/network')
  }

  function networkPage (location) {
    const { connection, localPeers, connectedPeers } = api.sbot.obs
    const { avatar } = api.about.html

    const state = {
      groups: [
        {
          name: 'connections',
          subgroups: [
            ...Connections({ localPeers, connectedPeers, avatar })
          ]
        },
        {
          name: 'replication',
          subgroups: [
            ReplicationIn({ connection }),
            ReplicationOut({ connection })
          ]
        },
        {
          name: 'invites',
          subgroups: [
            InvitePub({ connection }),
            InvitePeer({ connection })
          ]
        }
      ],
      activeGroup: Value(0)
    }

    const page = h('NetworkPage', [
      computed(state.activeGroup, index => {
        return h('div.container', [
          h('section.groups', state.groups.map((group, i) => {
            return h('div.group',
              {
                'className': i === index ? '-active' : '',
                'ev-click': () => state.activeGroup.set(i)
              },
              group.name
            )
          })),
          h('section.subgroups', state.groups[index].subgroups.map(Subgroup))
        ])
      })
    ])

    function Subgroup (subgroup) {
      return h('div.subgroup', [
        h('h2', subgroup.title),
        subgroup.body
      ])
    }

    var { container } = api.app.html.scroller({ prepend: page })
    container.title = '/network'
    container.keyboardScroll = function (n) {
      if (isNaN(n)) return

      state.activeGroup.set((state.activeGroup() + n) % state.groups.length)
    }
    return container
  }
}
