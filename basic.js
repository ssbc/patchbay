require('depject')(
  require('./modules_core'),
  require('./modules_basic')
).plugs.app[0]()


