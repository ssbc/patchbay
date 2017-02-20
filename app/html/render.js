const fs = require('fs')
const h = require('../h')
const { Value } = require('mutant')
const insertCss = require('insert-css')

exports.gives = nest([
  'app.html.render',
  'app.mcss.render'
])

exports.needs = nest({
  'page.html.render': 'first',
  styles: 'first'
})

exports.create = function (api) {
  return {
    app,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function app () {
    process.nextTick(() => insertCss(api.styles()))

    var view = Value(getView())
    var screen = h('App', view)

    window.onhashchange = () => view.set(getView())
    document.body.appendChild(screen)

    return screen
  }

  function getView () {
    const view = window.location.hash.substring(1) || 'tabs'
    return api.page(view)
  }
}

