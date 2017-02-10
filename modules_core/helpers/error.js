const fs = require('fs')
const h = require('../../h')

exports.gives = {
  helpers: { build_error: true }
}

exports.create = function (api) {
  return {
    helpers: { build_error }
  }

  function build_error (err) {
    return h('Error', [
      h('header', err.message),
      h('pre', err.stack)
    ])
  }

}
