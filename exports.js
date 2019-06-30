const bulk = require('bulk-require')
const patchcore = require('patchcore')
delete patchcore.patchcore.message.html.action.reply
// prune an action we don't want

const configModule = require('./config')

const patchbay = {
  patchbay: {
    about: getModules('about/**/*.js'),
    app: getModules('app/**/*.js'),
    blob: getModules('blob/**/*.js'),
    channel: getModules('channel/**/*.js'),
    contact: getModules('contact/**/*.js'),
    message: getModules('message/**/*.js'),
    router: getModules('router/**/*.js'),
    styles: getModules('styles/**/*.js'),
    sbot: getModules('sbot/**/*.js'),

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

module.exports = {
  configModule,
  plugins,
  patchbay,
  patchcore
}

function getModules (path) {
  return bulk(__dirname, [path])
}
