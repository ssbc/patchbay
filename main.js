const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

const context = require('patch-context')
const patchHub = require('patch-hub')
const horcrux = require('ssb-horcrux')
const gatherings = require('patch-gatherings')
const bayGatherings = require('patchbay-gatherings')
const patchbay = require('./')
const patchcore = require('patchcore')

const ssbchess = require('ssb-chess')

// polyfills
require('setimmediate')

// from more specialized to more general
const sockets = combine(
  context,
  patchHub,
  bayGatherings, //adds menu items
  gatherings,
  horcrux,
  patchbay,
  patchcore,
  ssbchess
)

const api = entry(sockets, nest('app.html.app', 'first'))

const app = api.app.html.app()
document.body.appendChild(app)

