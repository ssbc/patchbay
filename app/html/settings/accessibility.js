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
    const invert = api.settings.obs.get('patchbay.accessibility.invert')
    const saturation = api.settings.obs.get('patchbay.accessibility.saturation')
    const brightness = api.settings.obs.get('patchbay.accessibility.brightness')
    const contrast = api.settings.obs.get('patchbay.accessibility.contrast')

    return {
      title: 'Accessibility',
      body: h('AccessibilityStyles', [
        h('div', { 'ev-click': () => invert.set(!invert()) }, [
          h('label', 'Invert colors'),
          h('i.fa', { className: when(invert, 'fa-check-square', 'fa-square-o') })
        ]),
        h('div', [
          h('label', 'Saturation'),
          h('input', { type: 'range', min: 0, max: 100, value: saturation, 'ev-input': ev => saturation.set(ev.target.value) })
        ]),
        h('div', [
          h('label', 'Brightness'),
          h('input', { type: 'range', min: 0, max: 100, value: brightness, 'ev-input': ev => brightness.set(ev.target.value) })
        ]),
        h('div', [
          h('label', 'Contrast'),
          h('input', { type: 'range', min: 0, max: 100, value: contrast, 'ev-input': ev => contrast.set(ev.target.value) })
        ])
      ])
    }
  }
}
