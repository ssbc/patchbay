// polyfills
require('setimmediate')

require('depject')(
  require('./modules_embedded'),
  require('./modules_basic'),
  require('./modules_extra')
).app[0]()




