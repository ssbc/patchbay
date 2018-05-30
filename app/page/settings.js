const nest = require('depnest')
const { h } = require('mutant')

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
    'app.page.settings': publicPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'settings' })
    }, '/settings')
  }

  function publicPage (location) {
    var page = h('SettingsPage', { title: '/settings' }, [
      h('div.container', [
        h('h1', 'Settings'),
        api.app.html.settings().map(setting => {
          if (!setting.title && !setting.body) throw new Error('app.html.settings requires settings in form { title, body }')

          return h('section', [
            h('h2', setting.title),
            setting.body
          ])
        })
      ])
    ])

    var { container, content } = api.app.html.scroller({ prepend: page })
    container.title = 'Settings'
    return container
  }
}
