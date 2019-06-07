const nest = require('depnest')
const { h, when } = require('mutant')

exports.gives = nest({
  'app.html.settings': true
})

exports.needs = nest({
  'settings.obs.get': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.settings': accessibility
  })

  function accessibility () {
    const font = api.settings.obs.get('patchbay.accessibility.openDyslexicEnabled', false)

    return {
      group: 'accessibility',
      title: 'Dyslexia Fonts',
      body: h('AccessibilityStyles', [
        h('div', { 'ev-click': () => font.set(!font()) }, [
          h('label', 'Enable OpenDyslexic font'),
          h('i.fa', { className: when(font, 'fa-check-square', 'fa-square-o') })
        ])
      ])
    }
  }
}
