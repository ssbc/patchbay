const { Value } = require('mutant')
const insertCss = require('insert-css')

exports.needs = {
  h: 'first',
  page: 'first',
}

exports.gives = {
  app: true
}

exports.create = function (api) {
  return {
    app
  }

  function app () {
    const { h } = api
    const page = h('div.App', api.page())

    document.body.appendChild(page)

  }
}

