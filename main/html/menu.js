const nest = require('depnest')
const { h, Value } = require('mutant')

exports.gives = nest('main.html.menu')

exports.needs = nest('router.html.simpleRoute', 'map')

exports.create = function (api) {
  return nest('main.html.menu', menu)

  function menu (handleClick) {
    var state = Value('')

    return h('Menu', {
      classList: [ state ],
      'ev-mouseover': () => state.set('-active'),
      'ev-mouseout': () => state.set('')
    }, [
      h('div', api.router.html.simpleRoute(handleClick))
    ])
  }
}

