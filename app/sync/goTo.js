const nest = require('depnest')

exports.gives = nest({ 'app.sync.goTo': true })

exports.needs = nest({
  'app.html.tabs': 'first',
  'app.sync.addPage': 'first',
  'router.sync.normalise': 'first'
})

exports.create = function (api) {
  return nest('app.sync.goTo', function goTo (location, change) {
    const tabs = api.app.html.tabs()

    location = api.router.sync.normalise(location)
    const locationId = JSON.stringify(location)

    if (tabs.has(locationId)) {
      tabs.select(locationId)
      return true
    }

    api.app.sync.addPage(location, true, false)
    return change
  })
}

