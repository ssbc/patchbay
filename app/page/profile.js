const nest = require('depnest')
const Scroller = require('pull-scroll')
const pull = require('pull-stream')
const { h, watch } = require('mutant')

const next = require('../../junk/next-stepper')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.profile': true,
})

exports.needs = nest({
  'about': {
    'html.edit': 'first',
    'obs.name': 'first'
  },
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
  'contact.html.relationships': 'first',
  'keys.sync.id': 'first',
  'message.html.render': 'first',
  'sbot.pull.userFeed': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.profile': profilePage,
  })

  function menuItem () {
    return h('a', {
      style: { order: 0 },
      'ev-click': () => api.app.sync.goTo(api.keys.sync.id())
    }, '/profile')
  }

  function profilePage ({ feed: id }) {
    const profile = h('Profile', [
      h('section.edit', api.about.html.edit(id)),
      h('section.relationships', api.contact.html.relationships(id)),
      h('section.activity', [
        h('header', 'Activity')
        // ideally the scroller content would go in here
      ])
    ])

    var { container, content } = api.app.html.scroller({ prepend: profile })


    pull(
      api.sbot.pull.userFeed({id: id, old: false, live: true}),
      Scroller(container, content, api.message.html.render, true, false)
    )

    // how to handle when have scrolled past the start???

    pull(
      next(api.sbot.pull.userFeed, { id: id, reverse: true, limit: 50, live: false }, ['value', 'sequence']),
      // pull.through(console.log.bind(console)),
      Scroller(container, content, api.message.html.render, false, false)
    )

    container.id = id
    watch(api.about.obs.name(id), name => { container.title = '@' + name })
    return container
  }
}

