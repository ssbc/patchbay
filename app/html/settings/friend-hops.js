const nest = require('depnest')
const { h, computed, onceTrue, Value, watch } = require('mutant')
const merge = require('lodash/merge')

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
      const intHops = parseInt(hops)
      updateConfig(intHops)
    })

    return {
      title: 'Friend Hops',
      body: h('FriendHops', [
        h('div.description', [
          'Specify whose content you replicate, and thus the size and shape of your network.'
        ]),
        h('div.slider', [
          h('datalist', { id: 'friends-hop-datalist' }, [
            h('option', { value: 0, label: '0 - Only your messages' }),
            h('option', { value: 1, label: '1 - You and your friend\'s messages' }),
            h('option', { value: 2, label: '2 - You, your friend\'s, and your friend\'s friend\'s  messages' }),
            h('option', { value: 3, label: '3 - You, your friend\'s, your friend\'s friend\'s, and their friend\'s messages' })
          ]),
          h('input', {
            type: 'range',
            attributes: { list: 'friends-hop-datalist' },
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
