const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')
const values = require('lodash/values')

const { patchcore, patchbay, plugins, configModule } = require('./exports')

function Start (config = {}) {
  // polyfills
  require('setimmediate')

  const sockets = combine(
    ...values(plugins), // TODO spin up settings check which modules are wanted
    configModule(config),
    patchbay,
    patchcore
  )
  // plugins loaded first will over-ride core modules loaded later

  const api = entry(sockets, nest('app.sync.start', 'first'))
  api.app.sync.start()
}

module.exports = Start
