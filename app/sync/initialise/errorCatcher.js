const nest = require('depnest')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'router.sync.router': 'first',
  'app.html.tabs': 'first'
})

exports.create = function (api) {
  return nest('app.sync.initialise', errorCatcher)

  function errorCatcher () {
    const tabs = api.app.html.tabs()

    var { container: errorPage, addError } = api.router.sync.router('/errors')
    window.addEventListener('error', ev => {
      if (!tabs.has('/errors')) tabs.add(errorPage, true)

      addError(ev.error || ev)
    })
  }
}

