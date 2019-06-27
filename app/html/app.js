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
    return h('App', api.app.html.tabs({
      initial: initialTabs || api.settings.sync.get('patchbay.defaultTabs')
    }))
  }
}
