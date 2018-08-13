const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest({
  'app.html.settings': true
})

exports.needs = nest({
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
        h('p', 'Custom MCSS to be applied on this window.'),
        styles,
        h('button', {'ev-click': save}, 'Apply Styles')
      ])
    }

    function save () {
      api.settings.sync.set({
        patchbay: {
          customStyles: styles.value
        }
      })
    }
  }
}
