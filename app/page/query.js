const nest = require('depnest')
const { h, Value, Array: MutantArray, Struct, computed, when, map } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('mutant-scroll')
const next = require('pull-next-query')
const json5 = require('json5')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.query': true
})

exports.needs = nest({
  'message.html.render': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.query': queryPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'query' })
    }, '/query')
  }

  function queryPage (location) {
    const input = Value()
    const error = computed(input, i => {
      try {
        var query = json5.parse(i)
      } catch (err) {
        console.error(err)
        return err
      }
      if (!Array.isArray(query)) return
      if (!query.map(q => Object.keys(q)[0]).every(q => ['$filter', '$map', '$reduce'].includes(q))) return
      activateQuery()
    })
    const query = Value([])

    const activateQuery = () => query.set(json5.parse(input()))

    return h('Query', [
      h('section.query', [
        h('textarea', { 'ev-input': ev => input.set(ev.target.value) }),
        h('button', {
          className: when(error, '', '-primary'),
          disabled: when(error, 'disabled'),
          'ev-click': activateQuery
        }, 'Go!')
      ]),
      h('section.output', [
        computed(query, query => {
          return Scroller({
            streamToBottom: source(query),
            render: msg => h('pre', JSON.stringify(msg, null, 2))
          })
        })
      ])
    ])
  }

  function source (query) {
    const opts = {
      query,
      reverse: true,
      limit: 100
    }

    return api.sbot.pull.stream(server => {
      return next(server.query.read, opts, ['value', 'timestamp'])
    })
  }
}
