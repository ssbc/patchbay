// polyfills
require('setimmediate')

require('depject')(
  // from more specialized to more general
  // require('./modules_extra'),
  // require('./modules_basic'),
  // require('./modules_core')
  require('./modules_actual_core')
).app[0]()

