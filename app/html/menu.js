const nest = require('depnest')
const { h, Value } = require('mutant')

exports.gives = nest('app.html.menu')

exports.needs = nest({
  app: {
    'html.menuItem': 'map',
    'sync.goTo': 'first'
  }
})

exports.create = function (api) {
  var _menu

  return nest('app.html.menu', function menu () {
    if (_menu) return _menu

    var state = Value('')

    // TODO: move goTo out into each menuItem
    _menu = h('Menu', {
      classList: [ state ],
      'ev-mouseover': () => state.set('-active'),
      'ev-mouseout': () => state.set('')
    }, [
      h('div', api.app.html.menuItem(api.app.sync.goTo))
    ])

    return _menu
  })
}
