const nest = require('depnest')
const getMCSS = require('marama/lib/get-mcss')

exports.gives = nest('styles.mcss')

exports.create = function (api) {
  return nest('styles.mcss', (sofar = {}) => {
    sofar.marama = getMCSS()
    return sofar
  })
}
