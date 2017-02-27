const nest = require('depnest')
const ref = require('ssb-ref')
const Scroller = require('pull-scroll')
const pull = require('pull-stream')
const { h, watch } = require('mutant')
const next = require('../../../junk/next-stepper')

exports.gives = nest({
  'router.html.page': true
})
// menu_items

exports.needs = nest({
  'about.html.edit': 'first',
  'about.obs': {
    'name': 'first'
    // 'description': 'first',
    // 'image': 'first',
    // 'imageUrl',
    // 'names',
    // 'images',
  },
  'keys.sync.id': 'first',
  'main.html.scroller': 'first',
  'message.html.render': 'first',
  'sbot.pull.userFeed': 'first'
})


exports.create = function (api) {
  return nest({
    'router.html.page': page
  })
  // menu_items: () => h('a', {
  //   href: '#'+self_id,
  //   style: { order: 1 }
  // }, '/profile')

  function page (id) {
    if (!ref.isFeed(id)) return

    const profile =  h('Profile', [
      h('section.edit', api.about.html.edit(id)),
      // h('section.relationships', api.contact.relationships(id)),
      h('section.activity', [
        h('header', 'Activity')
        // ideally the scroller content would go in here
      ])
    ])

    var { container, content } = api.main.html.scroller({ prepend: profile })

    const name = api.about.obs.name(id) 
    watch(name, name => container.title = '@'+name)
    container.id = id

    pull(
      api.sbot.pull.userFeed({id: id, old: false, live: true}),
      Scroller(container, content, api.message.html.render, true, false)
    )

    //how to handle when have scrolled past the start???

    pull(
      next(api.sbot.pull.userFeed, { id: id, reverse: true, limit: 50, live: false }, ['value', 'sequence']),
      // pull.through(console.log.bind(console)),
      Scroller(container, content, api.message.html.render, false, false)
    )

    return container
  }
}


