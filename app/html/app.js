const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.html.tabs': 'first',
  'settings.sync.get': 'first'
})

exports.create = function (api) {
  return nest('app.html.app', app)

  function app (initialTabs) {
    var saveTabs = api.settings.sync.get('patchbay.saveTabs')
    var _initialTabs

    if (saveTabs) {
      _initialTabs = api.settings.sync.get('patchbay.openTabs')
    } else {
      _initialTabs = api.settings.sync.get('patchbay.defaultTabs')
    }

    return h('App', api.app.html.tabs({
      initial: initialTabs || _initialTabs
    }))
  }
}
