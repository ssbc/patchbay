const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.menu')

exports.needs = nest({
  'app.html.menuItem': 'map',
  'app.sync.goTo': 'first'
})

exports.create = function (api) {
  var _menu

  return nest('app.html.menu', function menu () {
    if (_menu) return _menu

    const menuItems = api.app.html.menuItem(api.app.sync.goTo).map(item => {
      // Remove custom order from dependencies that give app.html.menuItem
      item.style.order = null
      return item
    })
    const sortedMenuItems = Object.values(menuItems).sort((a, b) =>
      a.text.localeCompare(b.text)
    )

    // TODO: move goTo out into each menuItem
    _menu = h('i.Menu.fa.fa-bars', [
      h('div', sortedMenuItems)
    ])

    return _menu
  })
}
