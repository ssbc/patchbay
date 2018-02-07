const nest = require('depnest')

exports.gives = nest({ 'app.sync.goTo': true })

exports.needs = nest({
  'app.html.tabs': 'first',
  'history.obs.store': 'first',
  'history.sync.push': 'first',
  'router.async.normalise': 'first',
  'router.async.router': 'first'
})

exports.create = function (api) {
  return nest('app.sync.goTo', goTo)

  // TODO consider rolling single arg:
  //   goTo({ ...location, tmp: { openBackground, split, position } })
  //
  // prune `tmp` before pushing into history
  // allows a refactor of catch-keyboard-shortcut + patch-inbox
  //   - extracts scrollToMessage into app.page.thread
  //   - router.sync.router would take (location, { position }) ?

  function goTo (location, openBackground = false, split = false) {
    api.router.async.normalise(location, (err, location) => {
      if (err) throw err
    
      const locationId = JSON.stringify(location)

      const tabs = api.app.html.tabs()
      if (tabs.has(locationId)) {
        tabs.select(locationId)
        api.history.sync.push(location)
        return true
      }

      api.router.async.router(location, (err, page) => {
        debugger
        if (err) throw err

        if (!page) return

        page.id = page.id || locationId
        tabs.add(page, !openBackground, split)

        if (openBackground) {
          const history = api.history.obs.store()
          var _history = history()
          var current = _history.pop()

          history.set([ ..._history, location, current ])
        } else {
          api.history.sync.push(location)
        }
      })

      // return openBackground // might not be needed?
    })
  }
}
