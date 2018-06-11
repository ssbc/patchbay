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
    'app.html.settings': removeExif
  })

  function removeExif () {
    const removeExif = api.settings.obs.get('patchbay.removeExif', true)
    const toggleRemoveExif = (ev) => {
      api.settings.sync.set({patchbay: {removeExif: ev.target.checked}})
    }

    return {
      title: 'Exif metadata',
      body: h('DefaultTabs', [
        h('p', [
          'Remove exif metadata from images such as GPS coordinates, phone/camera brand etc.',
          h('input', {
            type: 'checkbox',
            checked: removeExif,
            'ev-change': toggleRemoveExif
          })
         ])
      ])
    }
  }
}

