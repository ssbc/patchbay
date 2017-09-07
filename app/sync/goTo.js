const nest = require('depnest')

exports.gives = nest({ 'app.sync.goTo': true })

exports.needs = nest({
  'app.html.tabs': 'first',
  'history.obs.store': 'first',
  'history.sync.push': 'first',
  'router.sync.normalise': 'first',
  'router.sync.router': 'first',
})

exports.create = function (api) {
  return nest('app.sync.goTo', goTo)

  function goTo (location, openBackground = false, split = false) {
    location = api.router.sync.normalise(location)
    const locationId = JSON.stringify(location)

    const tabs = api.app.html.tabs()
    if (tabs.has(locationId)) {
      tabs.select(locationId)
      return true
    }

    const page = api.router.sync.router(location)
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

    return openBackground
  }
}
