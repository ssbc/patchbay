const nest = require('depnest')
const { h, computed, onceTrue, Value, watch } = require('mutant')
const merge = require('lodash/merge')

exports.gives = nest({
  'app.html.settings': true
})

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.settings': 'map',
  'sbot.obs.connection': 'first',
  'config.sync.get': 'first',
  'config.sync.getCustom': 'first',
  'config.sync.setCustom': 'first'
})

const pubHopAll = 3
exports.create = function (api) {
  return nest({
    'app.html.settings': pubHopConnections
  })

  function pubHopConnections () {
    let hops = Value(api.config.sync.get('friendPub.hops', pubHopAll))
    hops.initial = hops()
    let pubs = Value({})

    watch(hops, hops => {
      updateConfig(hops)
      updatePubs(hops)
    })

    return {
      title: 'Pub gossip',
      body: h('FriendPub', [
        h('div.description', [
          'Limit gossip with pubs based on who owns the pub'
        ]),
        h('div.slider', [
          h('datalist', { id: 'pub-gossip-datalist' }, [
            h('option', { value: 0, label: 'My pub' }),
            h('option', { value: 1, label: 'My friend' }),
            h('option', { value: 2, label: 'A friends friend' }),
            h('option', { value: 3, label: 'Any pub' })
          ]),
          h('input', {
            type: 'range',
            attributes: { list: 'pub-gossip-datalist' },
            min: 0,
            max: 3,
            value: hops,
            'ev-change': (ev) => hops.set(ev.target.value)
          })
        ]),
        computed(hops, (_hops) => {
          if (_hops === hops.initial) return
          return h('div.alert', [
            h('i.fa.fa-warning'),
            ' please restart patchbay for this to take effect'
          ])
        }),
        Pubs(pubs)
      ])
    }

    function updatePubs (hops) {
      onceTrue(api.sbot.obs.connection, sbot => {
        if (hops === pubHopAll) pubs.set({})
        else {
          sbot.friendPub.pubsWithinHops(hops, (_, pubsInHops) => {
            pubs.set(pubsInHops)
          })
        }
      })
    }
  }

  function Pubs (pubs) {
    return h('Pubs', [
      h('div.description', 'Pubs this means you will gossip with:'),
      h('div.pubs', computed([pubs], function (pubs) {
        return Object.values(pubs).map(pub => pubImageLink(pub.id, pub.owner))
      }))
    ])
  }
  function pubImageLink (id, ownerId) {
    return h('a', {
      href: id,
      title: computed([api.about.obs.name(id), api.about.obs.name(ownerId)], (name, ownerName) => {
        return '@' + name + ', owner ' + ownerName
      })
    }, api.about.html.image(id))
  }

  function updateConfig (hops) {
    const configCustom = api.config.sync.getCustom()

    const next = merge({}, configCustom, {
      friendPub: { hops },
      gossip: hops >= 3
        ? { friends: true, global: true }
        : { friends: true, global: false }
    })

    api.config.sync.setCustom(next)
  }
}
