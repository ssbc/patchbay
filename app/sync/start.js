const nest = require('depnest')

exports.gives = nest('app.sync.start')

exports.needs = nest({
  'app.html.app': 'first',
  'app.page.errors': 'first',
  'app.sync.goTo': 'first',
  'app.sync.initialise': 'first',
  'config.sync.load': 'first',
  'history.obs.location': 'first',
  'history.sync.push': 'first',
  'settings.sync.get': 'first',
  'sbot.async.run': 'first'
})

exports.create = function (api) {
  return nest('app.sync.start', start)

  function start (opts = {}) {
    console.log('STARTING Patchbay UI')

    const App = api.app.html.app(opts.initialTabs)

    api.app.sync.initialise(App, api.config.sync.load())
    // runs all the functions in app/sync/initialise

    api.history.obs.location()(api.app.sync.goTo)

    api.sbot.async.run(server => {
      server.whoami((err, data) => {
        if (err) throw err
        document.body.appendChild(App)
      })
    })
  }
}
