const nest = require('depnest')
const { h, Value, when }  = require('mutant')

exports.gives = nest('app.html.menu')

exports.needs = nest({
  'app.html.menuItem': 'map',
  'app.sync.goTo': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  var _menu

  return nest('app.html.menu', function menu () {
    if (_menu) return _menu

    const hoverClass = Value('')
    const connectionClass = when(api.sbot.obs.connection, '', '-disconnected')

    const menuItems = api.app.html.menuItem(api.app.sync.goTo)
    const sortedMenuItems = Object.values(menuItems).sort((a, b) =>
      a.text.localeCompare(b.text)
    )

    // TODO: move goTo out into each menuItem
    _menu = h('Menu', {
      classList: [ hoverClass, connectionClass ],
      'ev-mouseover': () => hoverClass.set('-open'),
      'ev-mouseout': () => hoverClass.set('')
    }, [
      h('div', sortedMenuItems)
    ])

    return _menu
  })
}
