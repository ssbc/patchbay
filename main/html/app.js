const { Value, h } = require('mutant')
const nest = require('depnest')
const insertCss = require('insert-css')

exports.gives = nest('main.html.app')

exports.needs = nest({
  'router.html.page': 'first',
  'styles.css': 'reduce'
})

exports.create = function (api) {
  return nest('main.html.app', app)

  function app () {
    const css = values(api.styles.css()).join('\n')
    insertCss(css)

    // var view = Value(getView())
    var view = 'hello!'
    var screen = h('App', view)

    // window.onhashchange = () => view.set(getView())
    // document.body.appendChild(screen)

    return screen
  }

  // function getView () {
  //   const view = window.location.hash.substring(1) || 'tabs'
  //   return api.page(view)
  // }
}

function values (object) {
  const keys = Object.keys(object)
  return keys.map(k => object[k])
}

