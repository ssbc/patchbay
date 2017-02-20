const combine = require('depject')
const bulk = require('bulk-require')

// polyfills
require('setimmediate')

// from more specialized to more general
const sockets = combine(
  // require(patchgit)
  bulk(__dirname, [
    'page/**/*.js',
    'app/**/*.js'
  ]),
  require('patchcore')
)

const app = entry(sockets)

app()




function entry (sockets) {
  return sockets.app.html.render[0]()
}

