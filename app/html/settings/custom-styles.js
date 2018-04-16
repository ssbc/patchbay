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
    'app.html.settings': customStyles
  })

  function customStyles () {
    const customStyles = api.settings.obs.get('patchbay.customStyles', '')
    const styles = h('textarea', { value: customStyles })

    return {
      title: 'Custom Styles',
      body: h('CustomStyles', [
        h('p', 'Comma-seperated list of tabs which will open on startup.'),
        styles,
        h('button', {'ev-click': peachify}, 'Apply Styles')
      ])
    }

    function peachify () {
      api.settings.sync.set({
        patchbay: {
          customStyles: styles.value
        }
      })
    }
  }
}

