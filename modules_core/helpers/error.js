const fs = require('fs')
const h = require('../../h')

exports.gives = {
  helpers: { build_error: true },
  mcss: true
}

exports.create = function (api) {
  return {
    helpers: { build_error },
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function build_error (err) {
    return h('Error', [
      h('header', err.message),
      h('pre', err.stack)
    ])
  }
    
}

