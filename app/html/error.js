const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.error')

exports.create = function (api) {
  return nest('app.html.error', error)

  function error (err) {
    return h('Error', [
      h('header', err.message),
      h('pre', err.stack)
    ])
  }
}

