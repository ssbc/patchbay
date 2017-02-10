const insertCss = require('insert-css')

// polyfills
require('setimmediate')

require('depject')(
  // from more specialized to more general
  require('./modules_extra'),
  require('./modules_basic'),
  require('./modules_core')
).app[0]()

// imports styles/*.css|*.mcss
insertCss(require('./styles'))
