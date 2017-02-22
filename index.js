const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')
const bulk = require('bulk-require')

// polyfills
require('setimmediate')

// from more specialized to more general
const sockets = combine(
  // require(patchgit)
  bulk(__dirname, [
    'main/**/*.js',
    'router/html/page/**/*.js',
    'styles/**/*.js'
  ]),
  require('patchcore')
)

const api = entry(sockets, nest('main.html.app', 'first'))

const app = api.main.html.app()
document.body.appendChild(app)

