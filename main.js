const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

const horcrux = require('ssb-horcrux')
const ssbchess = require('ssb-chess')
const patchHub = require('patch-hub')
const gatherings = require('patch-gatherings')
const bayGatherings = require('patchbay-gatherings')
const patchbay = require('./')
const patchContext = require('patch-context')
const patchcore = require('patchcore')
const patchSettings = require('patch-settings')

// polyfills
require('setimmediate')

// from more specialized to more general
const sockets = combine(
  // horcrux,
  // ssbchess,
  // patchHub,
  // gatherings,
  // bayGatherings, // TODO collect gatherings into this
  patchbay,
  patchContext,
  patchcore,
  patchSettings
)

const api = entry(sockets, nest('app.html.app', 'first'))

const app = api.app.html.app()
document.body.appendChild(app)
