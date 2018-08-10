const nest = require('depnest')
const { h } = require('mutant')
const Tabs = require('hypertabs')

exports.gives = nest({
  'app.html.tabs': true
})

exports.needs = nest({
  'app.html.menu': 'first',
  'app.html.searchBar': 'first',
  'app.sync.goTo': 'first',
  'app.sync.locationId': 'first',
  'history.obs.store': 'first',
  'history.sync.push': 'first'
})

exports.create = function (api) {
  var _tabs

  return nest({
    'app.html.tabs': tabs
  })

  function tabs (initialTabs = []) {
    if (_tabs) return _tabs

    const onSelect = (indexes) => {
      const { id } = _tabs.get(indexes[0]).content

      try {
        var location = JSON.parse(id)
      } catch (e) {
        throw new Error('app.html.tabs expects all page ids to be stringified location objects')
      }

      api.history.sync.push(location)
      search.input.value = buildSearchBarTermFromLocation(location)
    }
    const onClose = (page) => {
      var history = api.history.obs.store()
      const prunedHistory = history().filter(loc => {
        return api.app.sync.locationId(loc) !== page.id
      })
      history.set(prunedHistory)
    }

    const search = api.app.html.searchBar()
    const menu = api.app.html.menu()

    _tabs = Tabs({
      onSelect,
      onClose,
      append: h('div.navExtra', [ search, menu ])
    })
    _tabs.currentPage = () => {
      const currentPage = _tabs.get(_tabs.selected[0])
      return currentPage && currentPage.firstChild
    }
    _tabs.nextTab = () => _tabs.currentPage() && _tabs.selectRelative(1)
    _tabs.previousTab = () => _tabs.currentPage() && _tabs.selectRelative(-1)
    _tabs.closeCurrentTab = () => _tabs.currentPage() && _tabs.remove(_tabs.selected[0])

    // # TODO: review - this works but is strange
    initialTabs.forEach(p => api.app.sync.goTo(p))
    if (initialTabs[0]) api.app.sync.goTo(initialTabs[0])
    return _tabs
  }
}

// TODO - move this responsibility out to the searchBar?
function buildSearchBarTermFromLocation (location) {
  const { page, query } = location

  if (page === 'search') return '?' + query

  const keys = Object.keys(location)
  if (page && keys.length === 1) return '/' + page

  return keys
    .map(k => location[k])
    .join(', ')
}
