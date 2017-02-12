// polyfills
require('setimmediate')

require('depject')(
  require('./modules_actual_core')
).app[0]()

