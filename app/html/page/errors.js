const nest = require('depnest')

exports.gives = nest('app.html.page')

exports.needs = nest({
  'app.html.scroller': 'first'
})

exports.create = function (api) {
  return nest('app.html.page', errorsPage)

  function errorsPage (path) {
    if (path !== '/errors') return

    var { container, content } = api.app.html.scroller()

    container.id = '/errors'
    container.classList = ['-errors']

    // add a dummy entry in the list

    return { container, content }
  }
}

