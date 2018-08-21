const nest = require('depnest')
const { assign } = Object
const getMCSS = require('marama/lib/get-mcss')

exports.gives = nest('styles.mcss')

exports.create = function (api) {
  return nest('styles.mcss', (sofar = {}) => {
    return assign(sofar, { marama: getMCSS() })
  })
}
