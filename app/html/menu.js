const nest = require('depnest')
const { h, Value, when } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.html.menu')

exports.needs = nest({
  'app.html.menuItem': 'map',
  'app.sync.goTo': 'first',
  'sbot.obs.connection': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = function (api) {
  var _menu

  return nest('app.html.menu', function menu () {
    if (_menu) return _menu

    const hoverClass = Value('')
    const connectionClass = when(api.sbot.obs.connection, '', '-disconnected')
    const newMessageClass = Value('')

    var timeOut
    pull(
      api.sbot.pull.stream(sbot => {
        const query = [{
          $filter: {
            timestamp: { $gt: 0 }
          }
        }, {
          $map: {
            author: ['value', 'author']
          }
        }]
        return sbot.query.read({ live: true, old: false, query })
      }),
      // pull.filter(a => a !== myKey), // could filter out my own messages
      pull.drain(m => {
        if (timeOut) return

        newMessageClass.set('-newMsg')
        timeOut = setTimeout(() => {
          newMessageClass.set('')
          timeOut = null
        }, 200)
      })
    )

    const menuItems = api.app.html.menuItem(api.app.sync.goTo).map(item => {
      // Remove custom order from dependencies that give app.html.menuItem
      item.style.order = null
      return item
    })
    const sortedMenuItems = Object.values(menuItems).sort((a, b) =>
      a.text.localeCompare(b.text)
    )

    // TODO: move goTo out into each menuItem
    _menu = h('Menu', {
      classList: [ hoverClass, connectionClass, newMessageClass ],
      'ev-mouseover': () => hoverClass.set('-open'),
      'ev-mouseout': () => hoverClass.set('')
    }, [
      h('div', sortedMenuItems)
    ])

    return _menu
  })
}
