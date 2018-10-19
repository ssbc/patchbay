const nest = require('depnest')
const { h, computed } = require('mutant')

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
    'app.html.settings': defaultTabs
  })

  function defaultTabs () {
    const defaultTabs = api.settings.obs.get('patchbay.defaultTabs', '')
    const setDefaultTabs = (ev) => {
      const tabs = ev.target.value.split(',').map(s => s.trim()).filter(Boolean)
      api.settings.sync.set({ patchbay: { defaultTabs: tabs } })
    }

    return {
      title: 'Default Tabs',
      body: h('DefaultTabs', [
        h('p', 'Comma-seperated list of tabs which will open on startup.'),
        h('p', [
          h('i', 'e.g. /public, #new-people, %9psz2xPwGhGG7mIkTIgCEy/xX7r6uQDNQyjl0Nopiw4=.sha256')
        ]),
        h('input', {
          value: computed(defaultTabs, tabs => tabs.join(', ')),
          'ev-input': setDefaultTabs
        })
      ])
    }
  }
}
