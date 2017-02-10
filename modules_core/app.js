const fs = require('fs')
const h = require('../h')
const { Value } = require('mutant')

exports.needs = {
  page: 'first'
}

exports.gives = {
  app: true
}

exports.create = function (api) {
  return {
    app
  }

  function app () {
    var view = Value(getView())
    var screen = h('App', view)

    window.onhashchange = () => view.set(getView())
    document.body.appendChild(screen)

    // tabs (another core module) currently handles this
    // window.addEventListener('error', window.onError = displayError)

    return screen
  }

  function getView () {
    const view = window.location.hash.substring(1) || 'tabs'
    return api.page(view)
  }
}

// function displayError (e) {
//   document.body.querySelector('.\\.content').appendChild(
//     h('div.page', [
//       h('Error', { title: e.message }, [
//         h('h1', e.message),
//         h('big', [
//           h('code', e.filename + ':' + e.lineno)
//         ]),
//         h('pre', e.error
//           ? (e.error.stack || e.error.toString())
//           : e.toString()
//         )
//       ])
//     ])
//   )
// }
