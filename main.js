const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')
const bulk = require('bulk-require')

// polyfills
require('setimmediate')

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

    config: require('./config'), // shouldn't be in here ?
    contextMenu: require('patch-context'),
    suggestions: require('patch-suggest'),
    settings: require('patch-settings'),
    drafts: require('patch-drafts'),
    inbox: require('patch-inbox'), // TODO - ideally this would be a standalone patch-* module
    history: require('patch-history')
  }
}

const post = {
  patchbay: {
    message: bulk(__dirname, [ 'post-patchcore/message/**/*.js' ])
  }
}

// from more specialized to more general
const sockets = combine(
  require('ssb-horcrux'),

  require('patchbay-dark-crystal'),
  require('patchbay-poll'),
  require('ssb-chess'),
  require('patchbay-gatherings'),
  require('patchbay-book'),
  patchbay,
  require('patchcore'),
  post
)

// remove patchcore reply for our version
var pcReplyIndex = sockets.message.html.action.findIndex(x => x.name == 'reply')
if (pcReplyIndex != -1)
  delete sockets.message.html.action[pcReplyIndex]

const api = entry(sockets, nest('app.html.app', 'first'))
const app = api.app.html.app

module.exports = patchbay

// for electro[n]
if (typeof window !== 'undefined') {
  document.body.appendChild(app())
}
