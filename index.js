require('depject')(
  // from more specialized to more general
  require('./modules_extra'),
  require('./modules_basic'),
  require('./modules_core')
).plugs.app[0]()

