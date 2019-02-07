const nest = require('depnest')
const Scroller = require('pull-scroll')
const pull = require('pull-stream')
const { h, watch, onceTrue, map, Dict, dictToCollection } = require('mutant')
const next = require('pull-next-query')
const Mutual = require('ssb-mutual')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.profile': true
})

exports.needs = nest({
  'about.html.edit': 'first',
  'about.obs.name': 'first',
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
  'contact.html.relationships': 'first',
  'contact.html.stats': 'first',
  'keys.sync.id': 'first',
  'message.html.render': 'first',
  'sbot.pull.stream': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.profile': profilePage
  })

  function menuItem () {
    return h('a', {
      'ev-click': () => api.app.sync.goTo(api.keys.sync.id())
    }, '/profile')
  }

  function profilePage (location) {
    const { feed: id } = location

    var balances = Dict()
    onceTrue(api.sbot.obs.connection, sbot => {
      if (!sbot.links) throw new Error('where ma sbot.links at?!')
      var mutual = Mutual.init(sbot)
      mutual.getAccountBalances(id, (err, data) => {
        if (err) console.log(err)
        if (data == null) return

        balances.set(data)
      })
    })

    const profile = h('Profile', [
      h('section.edit', api.about.html.edit(id)),
      h('section.relationships', api.contact.html.relationships(id)),
      h('section.credit', map(dictToCollection(balances), balance => {
        return h('div', ['💰 ', balance.value, ' ', balance.key])
      })),
      h('section.stats', api.contact.html.stats(id)),
      h('section.activity', [
        h('header', 'Activity')
        // ideally the scroller content would go in here
      ])
    ])

    var { container, content } = api.app.html.scroller({ prepend: profile })

    const source = (opts) => api.sbot.pull.stream(s => next(s.query.read, opts, ['value', 'timestamp']))
    const query = [{
      $filter: {
        value: {
          timestamp: { $gt: 0 },
          author: id
        }
      }
    }]

    pull(
      source({ query, live: true, old: false }),
      Scroller(container, content, render, true, false)
    )

    // how to handle when have scrolled past the start???

    pull(
      source({ query, reverse: true, limit: 50 }),
      Scroller(container, content, render, false, false)
    )

    watch(api.about.obs.name(id), name => { container.title = '@' + name })
    return container
  }

  function render (msg) {
    return api.message.html.render(msg, { showTitle: true })
  }
}
