require('depject')(
  require('./modules'),
  {'sbot-api.js': require('./sbot-api')()}
).plugs.app[0]()



