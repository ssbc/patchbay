const { h } = require('mutant')
const nest = require('depnest')
const insertCss = require('insert-css')
const Tabs = require('hypertabs')

exports.gives = nest('main.html.app')

exports.needs = nest({
  main: {
    async: {
      catchLinkClick: 'first'
    },
    html: {
      error: 'first',
      externalConfirm: 'first',
      menu: 'first',
      searchBar: 'first'
    },
    sync: {
      catchKeyboardShortcut: 'first'
    }
  },
  'router.html.page': 'first',
  'styles.css': 'reduce'
})

exports.create = function (api) {
  return nest('main.html.app', app)

  function app () {
    const css = values(api.styles.css()).join('\n')
    insertCss(css)

    const handleSelection = (path, change) => {
      if (tabs.has(path)) {
        tabs.select(path)
        return true
      }

      addPage(path, true, false)
      return change
    }
    const search = api.main.html.searchBar(handleSelection)
    const menu = api.main.html.menu(handleSelection)

    const tabs = Tabs(onSelect, { append: h('div.navExtra', [ search, menu ]) })
    function onSelect (indexes) {
      search.input.value = tabs.get(indexes[0]).content.id
    }

    const App = h('App', tabs)

    function addPage (link, change, split) {
      const page = api.router.html.page(link)
      if (!page) return

      page.id = page.id || link
      tabs.add(page, change, split)
    }

    const initialTabs = ['/public', '/private', '/notifications']
    initialTabs.forEach(p => addPage(p))
    tabs.select(0)

    // Catch keyboard shortcuts
    api.main.sync.catchKeyboardShortcut(window, { tabs, search })

    // Catch link clicks
    api.main.async.catchLinkClick(App, (link, { ctrlKey: openBackground, isExternal }) => {
      if (isExternal) return api.main.html.externalConfirm(link)

      if (tabs.has(link)) tabs.select(link)
      else {
        const changeTab = !openBackground
        addPage(link, changeTab)
      }
    })

    // Catch errors
    var { container: errorPage, content: errorList } = api.router.html.page('/errors')
    window.addEventListener('error', ev => {
      if (!tabs.has('/errors')) tabs.add(errorPage, true)

      const error = api.main.html.error(ev.error || ev)
      errorList.appendChild(error)
    })

    return App
  }
}

function values (object) {
  const keys = Object.keys(object)
  return keys.map(k => object[k])
}

