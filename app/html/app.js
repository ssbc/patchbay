const nest = require('depnest')
const { h } = require('mutant')
const insertCss = require('insert-css')
const electron = require('electron')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.async.catchLinkClick': 'first',
  'app.html.externalConfirm': 'first',
  'app.html.tabs': 'first',
  'app.page.errors': 'first',
  'app.sync.window': 'reduce',
  'app.sync.addPage': 'first',
  'app.sync.catchKeyboardShortcut': 'first',
  'router.sync.router': 'first',
  'router.sync.normalise': 'first',
  'styles.css': 'reduce',
  'settings.sync.get': 'first',
  'settings.sync.set': 'first'
})

exports.create = function (api) {
  return nest('app.html.app', app)

  function app () {
    window = api.app.sync.window(window)
    const css = values(api.styles.css()).join('\n')
    insertCss(css)

    const initialTabs = [ '/public', '/private', '/notifications' ]
    // NB router converts these to { page: '/public' }
    const tabs = api.app.html.tabs(initialTabs)

    const App = h('App', tabs)

    // Catch keyboard shortcuts
    api.app.sync.catchKeyboardShortcut(window, { tabs })

    // Catch link clicks
    api.app.async.catchLinkClick(App, (link, { ctrlKey: openBackground, isExternal }) => {
      if (isExternal) return api.app.html.externalConfirm(link)

      // TODO tidy up who and where this logic happens (do when adding patch-history)
      const location = api.router.sync.normalise(link)
      const tabId = JSON.stringify(location)
      if (tabs.has(tabId)) tabs.select(tabId)
      else {
        const changeTab = !openBackground
        api.app.sync.addPage(location, changeTab)
      }
    })

    // Catch errors
    var { container: errorPage, addError } = api.router.sync.router('/errors')
    window.addEventListener('error', ev => {
      if (!tabs.has('/errors')) tabs.add(errorPage, true)

      addError(ev.error || ev)
    })

    window.addEventListener('resize', function(e){
	var wc = electron.remote.getCurrentWebContents()
	wc && wc.getZoomFactor((zf) => {
	    api.settings.sync.set({
		zoomFactor: zf,
		bounds: electron.remote.getCurrentWindow().getBounds()
	    })
	})
    })

    var zoomFactor = api.settings.sync.get('zoom')
    if (zoomFactor)
	electron.remote.getCurrentWebContents().setZoomFactor(zoomFactor)
    var bounds = api.settings.sync.get('bounds')
    if (bounds)
	electron.remote.getCurrentWindow().setBounds(bounds)

    return App
  }
}

function values (object) {
  const keys = Object.keys(object)
  return keys.map(k => object[k])
}
