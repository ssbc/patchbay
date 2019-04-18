const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')
const values = require('lodash/values')

const { patchcore, patchbay, plugins } = require('./exports')

function Start (config = {}) {
  // polyfills
  require('setimmediate')

  const sockets = combine.apply(null, [
    ...values(plugins), // TODO spin up settings check which modules are wanted
    patchbay,
    patchcore
  ])
  // plugins loaded first will over-ride core modules loaded later

  const api = entry(sockets, nest('app.html.app', 'first'))
  document.body.appendChild(api.app.html.app())
}

module.exports = Start
