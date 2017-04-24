const nest = require('depnest')

exports.gives = nest({ 'app.sync.goTo': true })

exports.needs = nest({
  'app.html.tabs': 'first',
  'app.sync.addPage': 'first'
})

exports.create = function (api) {
  return nest('app.sync.goTo', function goTo (path, change) {
    const tabs = api.app.html.tabs()

    if (tabs.has(path)) {
      tabs.select(path)
      return true
    }

    api.app.sync.addPage(path, true, false)
    return change
  })
}

