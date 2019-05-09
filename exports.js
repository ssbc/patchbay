const bulk = require('bulk-require')
const nest = require('depnest')

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

    suggestions: require('patch-suggest'),
    settings: require('patch-settings'),
    drafts: require('patch-drafts'),
    history: require('patch-history')
  }
}

const plugins = {
  scry: require('patchbay-scry'),
  darkCrystal: require('patchbay-dark-crystal'),
  poll: require('patchbay-poll'),
  inbox: require('patch-inbox'), // TODO needs work
  chess: require('ssb-chess-mithril'),
  book: require('patchbay-book'),
  gatherings: require('patchbay-gatherings')
}

function configModule (config) {
  // This is needed to over-ride config.sync.load in patchcore.
  // By baking a fresh module with the config inside it,
  // we avoid a race condition around trying to set / get the config
  return {
    gives: nest('config.sync.load'),
    create: api => nest('config.sync.load', () => {
      console.log('called', config)
      return config
    })
  }
}

module.exports = {
  configModule,
  plugins,
  patchbay,
  patchcore
}
