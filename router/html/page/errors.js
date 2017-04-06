const nest = require('depnest')

exports.gives = nest('router.html.page')

exports.needs = nest({
  'main.html.scroller': 'first'
})

exports.create = function (api) {
  return nest('router.html.page', errorsPage)

  function errorsPage (path) {
    if (path !== '/errors') return

    var { container, content } = api.main.html.scroller()

    container.id = '/errors'
    container.classList = ['-errors']

    // add a dummy entry in the list

    return { container, content }
  }
}

