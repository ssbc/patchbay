const nest = require('depnest')
const { h, Value, computed } = require('mutant')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.settings': true
})

exports.needs = nest({
  'app.html.settings': 'map',
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.settings': settingsPage
  })

  function menuItem () {
    return h('a', {
      'ev-click': () => api.app.sync.goTo({ page: 'settings' })
    }, '/settings')
  }

  function settingsPage (location) {
    const state = {
      groups: groupSettings(api.app.html.settings()),
      activeGroup: Value(0)
    }

    var page = h('SettingsPage', { title: '/settings' }, [
      h('div.container', computed(state.activeGroup, activeGroup => {
        return [
          h('section.groups', state.groups.map((group, i) => {
            return h('div.group',
              {
                'className': i === activeGroup ? '-active' : '',
                'ev-click': () => state.activeGroup.set(i)
              },
              group.name
            )
          })),
          h('section.group-settings', state.groups[activeGroup].subgroups.map(Setting))
        ]
      }))
    ])

    function Setting (setting) {
      return h('div.setting', [
        h('h2', setting.title),
        setting.body
      ])
    }

    var { container } = api.app.html.scroller({ prepend: page })
    container.title = '/settings'
    container.keyboardScroll = function (n) {
      if (isNaN(n)) return

      state.activeGroup.set((state.activeGroup() + n) % state.groups.length)
    }
    return container
  }
}

function groupSettings (settings) {
  const groupedByGroup = settings
    .reduce((acc, setting) => {
      if (!setting.title || !setting.body) throw new Error('setting sections require title, body')

      const group = (setting.group || setting.title).toLowerCase()
      if (acc[group]) acc[group].push(setting)
      else acc[group] = [setting]

      return acc
    }, {})

  return Object.keys(groupedByGroup)
    .map(name => {
      return {
        name,
        subgroups: groupedByGroup[name]
      }
    })
    .sort((a, b) => {
      if (a === 'general') return -1
      else if (b === 'general') return 1
      else return a < b ? -1 : +1
    })
}
