const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')
const values = require('lodash/values')

const { patchcore, patchbay, plugins } = require('./exports')

function Start (config = {}) {
  localStorage.patchbayConfig = JSON.stringify(config)
  // HACK to get config accessible D:

  // polyfills
  require('setimmediate')

  const sockets = combine(
    ...values(plugins), // TODO spin up settings check which modules are wanted
    patchbay,
    patchcore
  )
  // plugins loaded first will over-ride core modules loaded later

  const api = entry(sockets, nest('app.sync.start', 'first'))
  api.app.sync.start(config)
}

module.exports = Start
