const nest = require('depnest')
const { h } = require('mutant')
const insertCss = require('insert-css')
const electron = require('electron')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.async.catchLinkClick': 'first',
  'app.html.tabs': 'first',
  'app.page.errors': 'first',
  'app.sync.window': 'reduce',
  'app.sync.goTo': 'first',
  'app.sync.catchKeyboardShortcut': 'first',
  'history.obs.location': 'first',
  'history.sync.push': 'first',
  'router.sync.router': 'first',
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

    const initialTabs = ['/public', '/inbox', '/notifications']
    // NB router converts these to { page: '/public' }
    const tabs = api.app.html.tabs(initialTabs)

    const App = h('App', tabs)

    // Catch user actions
    api.app.sync.catchKeyboardShortcut(window, { tabs })
    api.app.async.catchLinkClick(App)

    api.history.obs.location()(loc => api.app.sync.goTo(loc || {}) )

    // Catch errors
    var { container: errorPage, addError } = api.router.sync.router('/errors')
    window.addEventListener('error', ev => {
      if (!tabs.has('/errors')) tabs.add(errorPage, true)

      addError(ev.error || ev)
    })

    ////// TODO - extract this to keep patch-lite isolated from electron
    const { getCurrentWebContents, getCurrentWindow } = electron.remote
    window.addEventListener('resize', () => {
      var wc = getCurrentWebContents()
      wc && wc.getZoomFactor((zf) => {
        api.settings.sync.set({
          electron: {
            zoomFactor: zf,
            windowBounds: getCurrentWindow().getBounds()
          }
        })
      })
    })

    var zoomFactor = api.settings.sync.get('electron.zoomFactor')
    if (zoomFactor)
      getCurrentWebContents().setZoomFactor(zoomFactor)

    var bounds = api.settings.sync.get('electron.windowBounds')
    if (bounds)
      getCurrentWindow().setBounds(bounds)
    //////

    return App
  }
}

function values (object) {
  const keys = Object.keys(object)
  return keys.map(k => object[k])
}
