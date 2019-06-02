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
    const groups = groupSettings(api.app.html.settings())
    const groupNames = Object.keys(groups)
      .sort((a, b) => {
        if (a === 'general') return -1
        else if (b === 'general') return 1
        else return a < b ? -1 : +1
      })
    const activeGroup = Value('general') // NOTE this assume this group exists!

    var page = h('SettingsPage', { title: '/settings' }, [
      h('div.container', computed(activeGroup, _activeGroup => {
        return [
          h('section.groups', groupNames.map(group => {
            return h('div.group',
              {
                'className': group === _activeGroup ? '-active' : '',
                'ev-click': () => activeGroup.set(group)
              },
              group
            )
          })),
          h('section.group-settings', groups[_activeGroup].map(Setting))
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
    return container
  }
}

function groupSettings (settings) {
  return settings
    .reduce((acc, setting) => {
      if (!setting.title || !setting.body) throw new Error('setting sections require title, body')

      const group = (setting.group || setting.title).toLowerCase()
      if (acc[group]) acc[group].push(setting)
      else acc[group] = [setting]

      return acc
    }, {})
}
