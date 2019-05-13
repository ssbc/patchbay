const nest = require('depnest')
const { h, Value, resolve, watch, computed } = require('mutant')
const { clone, set, get, isEmpty } = require('lodash')

exports.gives = nest({
  'app.html.settings': true
})

exports.needs = nest({
  'app.html.settings': 'map',
  'config.sync.get': 'first',
  'config.sync.getCustom': 'first',
  'config.sync.setCustom': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.settings': torOnly
  })

  function torOnly () {
    const torOnly = Value(isTorOnly(api.config.sync.get()))
    torOnly.initial = torOnly()

    watch(torOnly, (torOnly) => {
      updateConfig(torOnly)
    })

    return {
      title: 'Tor only connections',
      body: h('TorOnly', [
        h('p', [
          'Preserve your ip privacy by only connecting to other nodes using tor',
          h('input', {
            type: 'checkbox',
            checked: torOnly,
            'ev-change': () => torOnly.set(!resolve(torOnly))
          })
        ]),
        computed(torOnly, (_torOnly) => {
          if (_torOnly === torOnly.initial) return
          return h('div.alert', [
            h('i.fa.fa-warning'),
            ' please restart patchbay for this to take effect'
          ])
        })
      ])
    }
  }

  function updateConfig (torOnly) {
    var next = clone(api.config.sync.getCustom())

    if (torOnly) {
      set(next, 'connections.outgoing.onion', [{ 'transform': 'shs' }])
      set(next, 'connections.outgoing.net', [])
    } else if (get(next, 'connections.outgoing.onion')) {
      delete next.connections.outgoing.onion
      delete next.connections.outgoing.net
      if (isEmpty(next.connections.outgoing)) delete next.connections.outgoing
      if (isEmpty(next.connections)) delete next.connections
    }

    api.config.sync.setCustom(next)
  }
}

function isTorOnly (config) {
  const onionOut = get(config, 'connections.outgoing.onion[0]')
  const netOut = get(config, 'connections.outgoing.net[0]')

  return onionOut && !netOut
}
