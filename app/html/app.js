const nest = require('depnest')
const { h } = require('mutant')
const insertCss = require('insert-css')

exports.gives = nest('app.html.app')

exports.needs = nest({
  app: {
    async: {
      catchLinkClick: 'first'
    },
    html: {
      error: 'first',
      externalConfirm: 'first',
      tabs: 'first',
      page: 'first'
    },
    sync: {
      window: 'reduce',
      addPage: 'first',
      catchKeyboardShortcut: 'first'
    }
  },
  'styles.css': 'reduce'
})

exports.create = function (api) {
  return nest('app.html.app', app)

  function app () {
    window = api.app.sync.window(window)
    const css = values(api.styles.css()).join('\n')
    insertCss(css)

    const initialTabs = ['/public', '/private', '/notifications']
    const tabs = api.app.html.tabs(initialTabs)
    const { addPage } = api.app.sync

    const App = h('App', tabs)

    // Catch keyboard shortcuts
    api.app.sync.catchKeyboardShortcut(window, { tabs })

    // Catch link clicks
    api.app.async.catchLinkClick(App, (link, { ctrlKey: openBackground, isExternal }) => {
      if (isExternal) return api.app.html.externalConfirm(link)

      if (tabs.has(link)) tabs.select(link)
      else {
        const changeTab = !openBackground
        addPage(link, changeTab)
      }
    })

    // Catch errors
    var { container: errorPage, content: errorList } = api.app.html.page('/errors')
    window.addEventListener('error', ev => {
      if (!tabs.has('/errors')) tabs.add(errorPage, true)

      const error = api.app.html.error(ev.error || ev)
      errorList.appendChild(error)
    })

    return App
  }
}

function values (object) {
  const keys = Object.keys(object)
  return keys.map(k => object[k])
}


