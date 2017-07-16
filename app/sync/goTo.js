const nest = require('depnest')

exports.gives = nest({ 'app.sync.goTo': true })

exports.needs = nest({
  'app.html.tabs': 'first',
  'app.sync.addPage': 'first'
})

exports.create = function (api) {
  return nest('app.sync.goTo', function goTo (location, change) {
    const tabs = api.app.html.tabs()

    const locationSignature = JSON.stringify(location)

    if (tabs.has(locationSignature)) {
      tabs.select(locationSignature)
      return true
    }

    api.app.sync.addPage(location, true, false)
    return change
  })
}

