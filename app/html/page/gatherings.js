const nest = require('depnest')
const pull = require('pull-stream')
const { h, Array } = require('mutant')

exports.gives = nest({
  'app.html': {
    page: true,
    menuItem: true
  }
})

exports.needs = nest({
  'app.html.scroller': 'first',
  'gathering.html': {
    create: 'first',
    render: 'first'
  },
  'gathering.pull.find': 'first'
})

exports.create = function (api) {
  const route = '/gatherings'
  return nest({
    'app.html': {
      menuItem: menuItem,
      page: gatheringsPage
    }
  })

  function menuItem (handleClick) {
    return h('a', {
      style: { order: 0 },
      'ev-click': () => handleClick(route)
    }, route)
  }

  function gatheringsPage (path) {
    if (path !== route) return

    const creator = api.gathering.html.create({})
    const gatherings = Array([])
    const content = h('section.content', {}, gatherings)
    const { container } = api.app.html.scroller({content, prepend: [creator]}) 

    pull(
      api.gathering.pull.find(),
      pull.drain(msg => {
        gatherings.push(api.gathering.html.render(msg))
      })
    )

    return container
  }
}


