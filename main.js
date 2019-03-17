const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')
const values = require('lodash/values')

const { patchcore, patchbay, plugins } = require('./exports')

function App (config = {}) {
  // polyfills
  require('setimmediate')

  // TODO spin up settings check which modules are wanted
  const args = [ ...values(plugins), patchbay, patchcore ]
  // plugings loaded first will over-ride core modules loaded later
  const sockets = combine.apply(null, args)

  const api = entry(sockets, nest('app.html.app', 'first'))
  document.body.appendChild(api.app.html.app())
}

module.exports = App

// // for electro[n]
// if (typeof window !== 'undefined' && !module.parent.parent) {
//   App()
// }
