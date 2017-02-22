const { h } = require('mutant')
const nest = require('depnest')

exports.gives = nest('router.html.page')

exports.create = function (api) {
  return nest('router.html.page', (path) => {
    if (path !== '/private') return

    return h('div.private', 'private')
  })
}

