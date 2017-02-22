const { h } = require('mutant')
const nest = require('depnest')

exports.gives = nest('router.html.page')

exports.create = function (api) {
  return nest('router.html.page', (path) => {
    if (path !== '/public') return

    return h('div.public', 'public')
  })
}

