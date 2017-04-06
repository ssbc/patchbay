const nest = require('depnest')
const { h, Value } = require('mutant')

exports.gives = nest('app.html.menu')

exports.needs = nest('app.html.menuItem', 'map')

exports.create = function (api) {
  return nest('app.html.menu', menu)

  function menu (handleClick) {
    var state = Value('')

    return h('Menu', {
      classList: [ state ],
      'ev-mouseover': () => state.set('-active'),
      'ev-mouseout': () => state.set('')
    }, [
      h('div', api.app.html.menuItem(handleClick))
    ])
  }
}

