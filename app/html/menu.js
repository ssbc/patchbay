const nest = require('depnest')
const { h, Value, when, computed } = require('mutant')

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

    const sortByProp = (prop) => (a, b) => {
      if (a[prop] < b[prop]) {
        return -1
      }
      if (a[prop] > b[prop]) {
        return 1
      }
      return 0
    }

    const menuItems = api.app.html.menuItem(api.app.sync.goTo)
    const sortedMenuItems = computed([menuItems], items =>
      Object.values(items).sort(sortByProp('text'))
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
