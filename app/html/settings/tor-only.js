const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest({
  'app.html.settings': true
})

exports.needs = nest({
  'app.html.settings': 'map',
  'settings.obs.get': 'first',
  'settings.sync.set': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.settings': torOnly
  })

  function torOnly () {
    const torOnly = api.settings.obs.get('patchbay.torOnly', false)
    const toggleTorOnly = (ev) => {
      api.settings.sync.set({patchbay: {torOnly: ev.target.checked}})

      alert("please restart patchbay for this to take effect")
    }

    return {
      title: 'Tor only connections',
      body: h('DefaultTabs', [
        h('p', [
          'Preserve your ip privacy by only connecting to other nodes using tor',
          h('input', {
            type: 'checkbox',
            checked: torOnly,
            'ev-change': toggleTorOnly
          })
        ])
      ])
    }
  }
}
