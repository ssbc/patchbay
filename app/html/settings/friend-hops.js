const nest = require('depnest')
const { h, computed, Value, watch } = require('mutant')
const merge = require('lodash/merge')
const fs = require('fs')
const { join } = require('path')

exports.gives = nest({
  'app.html.settings': true
})

exports.needs = nest({
  'app.html.settings': 'map',
  'config.sync.get': 'first',
  'config.sync.getCustom': 'first',
  'config.sync.setCustom': 'first'
})

const friendsHops = 2
exports.create = function (api) {
  return nest({
    'app.html.settings': friendHopsConnections
  })

  function friendHopsConnections () {
    let hops = Value(api.config.sync.get('friends.hops', friendsHops))
    hops.initial = hops()

    watch(hops, hops => {
      updateConfig(hops)
    })

    return {
      group: 'gossip',
      title: 'Friend Hops',
      body: h('FriendHops', [
        h('div.description', [
          'What you replicate (store a local copy of) is based on how many "hops" you replicate. If you replicate out to 1 hop, you are replicating the people you follow, at 2 hops, it is your follows and people they follow. Play with the slider to see this visualised in the graphic below!'
        ]),
        h('div.slider', [
          h('datalist', { id: 'friends-hop-datalist' }, [
            h('option', { value: 0, label: '0' }),
            h('option', { value: 1, label: '1' }),
            h('option', { value: 2, label: '2' }),
            h('option', { value: 3, label: '3' })
          ]),
          h('input', {
            type: 'range',
            attributes: { list: 'friends-hop-datalist' },
            min: 0,
            max: 3,
            value: hops,
            'ev-change': (ev) => hops.set(parseInt(ev.target.value))
          })
        ]),
        h('div.alert',
          {
            style: {
              opacity: computed(hops, (_hops) => (_hops === hops.initial) ? 0 : 1)
            }
          },
          [
            h('i.fa.fa-warning'),
            ' please restart patchbay for this to take effect'
          ]
        ),
        h('FollowGraph', {
          className: computed(hops, hops => {
            switch (hops) {
              case 0: return '-zero'
              case 1: return '-one'
              case 2: return '-two'
              default: return '-three'
            }
          }),
          innerHTML: fs.readFileSync(join(__dirname, 'friend-hops-graph.svg'), 'utf8')
        })
      ])
    }
  }

  function updateConfig (hops) {
    const configCustom = api.config.sync.getCustom()

    const next = merge({}, configCustom, {
      friends: { hops }
    })

    api.config.sync.setCustom(next)
  }
}
