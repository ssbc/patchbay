const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.errors')

exports.needs = nest({
  'app.html.scroller': 'first'
})

exports.create = function (api) {
  return nest('app.page.errors', errorsPage)

  function errorsPage (location) {
    var { container, content } = api.app.html.scroller()

    container.title = '/errors'
    container.classList = ['Errors']
    container.id = JSON.stringify(location)
    // note this page needs an id assigned as it's not added by addPage

    function addError (err) {
      const error = h('Error', [
        h('header', err.message),
        h('pre', err.stack)
      ])

      content.appendChild(error)
    }

    return { container, addError }
  }
}
