const nest = require('depnest')

exports.gives = nest({ 'app.sync.addPage': true })

exports.needs = nest({
  'app.html.tabs': 'first',
  'app.html.page': 'first'
})

exports.create = function (api) {
  return nest({
    'app.sync': {
      addPage
    }
  })

  // TODO : make it so error catching doesn't need this, move it into goTo
  function addPage (link, change, split) {
    const tabs = api.app.html.tabs()

    const page = api.app.html.page(link)
    if (!page) return

    page.id = page.id || link
    tabs.add(page, change, split)
  }
}


