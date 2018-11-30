const nest = require('depnest')
const requireStyle = require('require-style')
const { assign } = Object

exports.gives = nest('styles.css')

exports.create = function (api) {
  return nest('styles.css', (sofar = {}) => {
    return assign(sofar, { highlightJs: requireStyle('highlight.js/styles/solarized-dark.css') })
  })
}
