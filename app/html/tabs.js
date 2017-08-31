const nest = require('depnest')
const { h } = require('mutant')
const Tabs = require('hypertabs')

exports.gives = nest({
  'app.html.tabs': true
})

exports.needs = nest({
  'app.html.menu': 'first',
  'app.html.searchBar': 'first',
  'app.sync.addPage': 'first'
})

exports.create = function (api) {
  var _tabs

  function tabs (initialTabs = []) {
    if (_tabs) return _tabs

    const search = api.app.html.searchBar()
    const menu = api.app.html.menu()
    const onSelect = (indexes) => {
      const { id } = _tabs.get(indexes[0]).content

      try {
        const location = JSON.parse(id)
        var locationForSearchBar = Object.keys(location)
          .map(k => location[k])
          .join(' + ')
      } catch (e) {
        throw new Error('app.html.tabs expects all page ids to be stringified location objects')
      }
      search.input.value = locationForSearchBar
    }
    _tabs = Tabs(onSelect, {
      append: h('div.navExtra', [ search, menu ])
    })
    _tabs.getCurrent = () => _tabs.get(_tabs.selected[0])

    // # TODO: review - this works but is strange
    initialTabs.forEach(p => api.app.sync.addPage(p))
    _tabs.select(0)
    return _tabs
  }

  return nest({
    'app.html.tabs': tabs
  })
}
