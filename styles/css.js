const { assign } = Object
const { each, map } = require('libnested')
const nest = require('depnest')

exports.gives = nest('styles.css')

exports.needs = {
  styles: {
    mcss: 'reduce',
    mixins: 'reduce'
  }
}

exports.create = (api) => (sofar = {}) => {
  const mcssObj = api.styles.mcss()
  const mixinObj = api.styles.mixins()

  const mcssMixinsStr = mixinsToMcss(mixinObj)
  const cssObj = mcssToCss(mcssObj, mcssMixinsStr)
  return assign(sofar, cssObj)
}

function mixinsToMcss (mixinsObj) {
  var mcss = ''
  each(mixinsObj, (mixinStr, [name]) => {
    // QUESTION: are mixins mcss specific or should we convert to mcss here?
    // as in, mixins are dom style objects and we use something like `inline-style` package
    mcss += mixinStr +'\n'
  })
  return mcss
}

function mcssToCss (mcssObj, mixinsStr) {
  return map(mcssObj, (mcssStr, [name]) => {
    return compile(mixinsStr + '\n' + mcssStr)
  })
}
