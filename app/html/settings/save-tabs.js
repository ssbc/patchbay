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
    'app.html.settings': saveTabs
  })

  function saveTabs () {
    const saveTabs = api.settings.obs.get('patchbay.saveTabs', false)
    const toggleSaveTabs = (ev) => {
      api.settings.sync.set({ patchbay: { saveTabs: ev.target.checked } })
    }

    return {
      group: 'general',
      title: 'Save Tabs',
      body: h('SaveTabsStyles', [
        h('p', [
          'Save open tabs when Patchbay is closed',
          h('input', {
            type: 'checkbox',
            checked: saveTabs,
            'ev-change': toggleSaveTabs
          })
        ])
      ])
    }
  }
}
