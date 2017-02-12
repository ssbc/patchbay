const path = require('path')
const ssbKeys = require('ssb-keys')

// polyfills
require('setimmediate')

function configurify () {
  var config = require('ssb-config/inject')(process.env.ssb_appname)
  config.keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
  // NOTE - this current does not export a config.remote

  return {
    gives: { config: true },
    create: function (api) { 
      return { 
        config: () => config
      }
    }
  }
}

require('depject')(
  [configurify()],  // mw is fixing so we don't need to array
  require('./modules_actual_core')
).app[0]()

