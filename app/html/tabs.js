const nest = require('depnest')
const { h } = require('mutant')
const Tabs = require('hypertabs')

exports.gives = nest({
  app: {
    'html.tabs': true,
    sync: {
      'goTo': true,
      'addPage': true
    }
  }
})

exports.needs = nest({
  'app.html': {
    menu: 'first',
    page: 'first',
    searchBar: 'first'
  }
})

exports.create = function (api) {

  var _tabs

  function tabs (initialTabs = []) {
    if (_tabs) return _tabs

    const search = api.app.html.searchBar(goTo)
    const menu = api.app.html.menu(goTo)
    const onSelect = (indexes) => {
      search.input.value = _tabs.get(indexes[0]).content.id
    }
    _tabs = Tabs(onSelect, {
      append: h('div.navExtra', [ search, menu ]) 
    })

    initialTabs.forEach(p => addPage(p))
    _tabs.select(0)
    return _tabs
  }

  function goTo (path, change) {
    tabs()
    if (_tabs.has(path)) {
      _tabs.select(path)
      return true
    }

    addPage(path, true, false)
    return change
  }

  function addPage (link, change, split) {
    tabs()
    const page = api.app.html.page(link)
    if (!page) return

    page.id = page.id || link
    _tabs.add(page, change, split)
  }

  return nest({
    app: {
      'html.tabs': tabs,
      sync: {
        goTo,
        addPage
      }
    }
  })
}

