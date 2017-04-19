const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

// const git = require('patch-git')
const horcrux = require('ssb-horcrux')
const patchbay = require('./')
const patchcore = require('patchcore')

// polyfills
require('setimmediate')

// from more specialized to more general
const sockets = combine(
  // git,
  {'patch-context': require('patch-context') },
  horcrux,
  patchbay,
  patchcore
)

const api = entry(sockets, nest('app.html.app', 'first'))

const app = api.app.html.app()
document.body.appendChild(app)

