const nest = require('depnest')

exports.gives = nest({
  'app.sync.start': true,
  'config.sync.load': true // used by patchcore
})

exports.needs = nest({
  'app.html.app': 'first',
  'app.page.errors': 'first',
  'app.sync.goTo': 'first',
  'app.sync.initialise': 'first',
  'history.obs.location': 'first',
  'history.sync.push': 'first',
  'settings.sync.get': 'first'
})

exports.create = function (api) {
  var _config
  return nest({
    'app.sync.start': start,
    'config.sync.load': config
  })

  function start (config, opts = {}) {
    console.log('STARTING Patchbay UI')

    _config = config
    localStorage.patchbayConfig = null

    const App = api.app.html.app(opts.initialTabs)

    api.app.sync.initialise(App, config)
    // runs all the functions in app/sync/initialise

    api.history.obs.location()(api.app.sync.goTo)

    document.body.appendChild(App)
    return App
  }

  function config () {
    console.log('getting called!!!')
    return _config || JSON.parse(localStorage.patchbayConfig)
    // HACK - there's a depject race condition where config.sync.load is being called
    // before app.sync.start is called!
  }
}
