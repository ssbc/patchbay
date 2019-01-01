const nest = require('depnest')
const { h, computed, onceTrue, Value } = require('mutant')

exports.gives = nest({
  'app.html.settings': true
})

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.settings': 'map',
  'sbot.obs.connection': 'first',
  'settings.obs.get': 'first',
  'settings.sync.set': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.settings': pubHopConnections
  })

  function pubHopConnections () {
    const pubHopConnections = api.settings.obs.get('patchbay.pubHopConnections', "3")
    const changeHopSettings = (ev) => {
      api.settings.sync.set({patchbay: {pubHopConnections: ev.target.value}})

      alert("please restart patchbay for this to take effect")
    }

    let pubs = Value({})

    const pubHopConnectionsText = computed([pubHopConnections], function(pubHopConnections) {
      onceTrue(api.sbot.obs.connection, sbot => {
        sbot.friendPub.pubsWithinHops(parseInt(pubHopConnections), (err, pubsInHops) => {
          pubs.set(pubsInHops)
        })
      })

      switch (pubHopConnections) {
      case "0":
        return "Own pub only"
      case "1":
        return "Pubs run by friends"
      case "2":
        return "Pubs run by friends of friends"
      default: // 3
        return "All pubs"
      }
    })

    function pubImageLink (id, ownerId) {
      return h('a', {
        href: id,
        title: computed([api.about.obs.name(id), api.about.obs.name(ownerId)], (name, ownerName) => {
          return '@' + name + ', owner ' + ownerName
        })
      }, api.about.html.image(id))
    }

    const pubsHtml = computed([pubs], function(pubs) {
      return Object.values(pubs).map(pub => pubImageLink(pub.id, pub.owner))
    })
    
    return {
      title: 'Pub within hops connections',
      body: h('FriendPub', [
        h('div', [
          'Only connect to pubs run by a peer within a certain number of hops',
          h('input', {
            type: 'range',
            attributes: { list: 'datalist' },
            min: 0,
            max: 3,
            value: pubHopConnections,
            'ev-change': changeHopSettings
          }),
          h('datalist', { id: 'datalist' }, [
            h('option', 0),
            h('option', 1),
            h('option', 2),
            h('option', 3)]),
          h('div', ["Current setting: ", pubHopConnectionsText]),
          h('div', pubsHtml)
        ])
      ])
    }
  }
}
