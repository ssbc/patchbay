const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.settings': true
})

exports.needs = nest({
  'app.sync.goTo': 'first',
  'settings.obs.get': 'first',
  'settings.sync.set': 'first'
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
    const customStyles = api.settings.obs.get('patchbay.customStyles', '')
    const styles = h('textarea', { value: customStyles() })

    return h('SettingsPage', { title: '/settings' }, [
      h('div.container', [
        h('h1', 'Settings'),
        h('h2', 'Custom Styles'),
        h('p', 'Add custom styles (accepts CSS and MCSS)'),
        styles,
        h('button', {'ev-click': peachify}, 'Apply Styles')
      ])
    ])

    function peachify () {
      api.settings.sync.set({
        patchbay: {
          customStyles: styles.value
        }
      })
    }
  }
}
