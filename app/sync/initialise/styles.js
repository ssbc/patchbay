const nest = require('depnest')
const insertCss = require('insert-css')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'styles.css': 'reduce',
})


exports.create = function (api) {
  return nest('app.sync.initialise', styles)

  function styles () {
    const css = values(api.styles.css()).join('\n')
    insertCss(css)
  }
}

function values (object) {
  const keys = Object.keys(object)
  return keys.map(k => object[k])
}

