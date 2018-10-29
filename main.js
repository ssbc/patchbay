const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')
const bulk = require('bulk-require')

// polyfills
require('setimmediate')

const patchcore = require('patchcore')
delete patchcore.patchcore.message.html.action.reply
// prune an action we don't want

const patchbay = {
  patchbay: {
    about: bulk(__dirname, [ 'about/**/*.js' ]),
    app: bulk(__dirname, [ 'app/**/*.js' ]),
    blob: bulk(__dirname, [ 'blob/**/*.js' ]),
    channel: bulk(__dirname, [ 'channel/**/*.js' ]),
    contact: bulk(__dirname, [ 'contact/**/*.js' ]),
    message: bulk(__dirname, [ 'message/**/*.js' ]),
    router: bulk(__dirname, [ 'router/**/*.js' ]),
    styles: bulk(__dirname, [ 'styles/**/*.js' ]),
    sbot: bulk(__dirname, [ 'sbot/**/*.js' ]),

    config: require('./config'), // shouldn't be in here ?
    contextMenu: require('patch-context'),
    suggestions: require('patch-suggest'),
    settings: require('patch-settings'),
    drafts: require('patch-drafts'),
    history: require('patch-history')
  }
}
module.exports = patchbay

// for electro[n]
if (typeof window !== 'undefined') {
  // modules loaded first over-ride core modules loaded later
  const sockets = combine(
    require('patchbay-scry'),
    require('patchbay-dark-crystal'),
    require('patchbay-poll'),
    require('ssb-chess-mithril'),
    require('patchbay-gatherings'),
    require('patchbay-book'),
    require('patch-inbox'), // TODO needs work
    patchbay,
    patchcore
  )

  const api = entry(sockets, nest('app.html.app', 'first'))
  document.body.appendChild(api.app.html.app())
}
