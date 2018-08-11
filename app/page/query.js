const nest = require('depnest')
const { h, Value, computed, when } = require('mutant')
const Scroller = require('mutant-scroll')
const next = require('pull-next-query')
const json5 = require('json5')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.query': true
})

exports.needs = nest({
  'app.sync.goTo': 'first',
  'message.html.render': 'first',
  'sbot.pull.stream': 'first'
})

// TODO ?? extract a module patchbay-devtools ?
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
        // console.error(err)
        return err
      }
      if (isValidQuery(query)) activateQuery()
    })

    const { initialQuery, initialValue } = getInitialState(location)
    const query = Value(initialQuery)

    const activateQuery = () => query.set(json5.parse(input()))

    return h('Query', { title: '/query' }, [
      h('section.query', [
        h('textarea', { 'ev-input': ev => input.set(ev.target.value), value: initialValue }),
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
            render: msg => h('pre', JSON.stringify(msg, null, 2)),
            comparer: (a, b) => {
              if (a && b && a.key && b.key) return a.key === b.key
              return a === b
            }
          })
        })
      ])
    ])
  }

  function source (query) {
    const opts = {
      query,
      reverse: true,
      limit: 50
    }

    return api.sbot.pull.stream(server => {
      return next(server.query.read, opts, ['value', 'timestamp'])
    })
  }
}

function getInitialState (location) {
  const { initialQuery, initialValue } = location
  if (isValidQuery(initialQuery)) {
    return {
      initialQuery,
      initialValue: initialValue || json5.stringify(initialQuery, null, 2)
    }
  }

  const defaultValue = `[{
  $filter: {
    value: {
      timestamp: {$gt: 0},
      content: {
        type: 'post'
      }
    }
  }
}, {
  $map: {
    author: ['value', 'author'],
    text: ['value', 'content', 'text'],
    ts: {
      received: ['timestamp'],
      asserted: ['value', 'timestamp']
    }
  }
}]

// $filter - used to prune down results. This must be the first entry, as ssb-query uses it to determine the most optimal index for fast lookup.

// $map - optional, can be used to pluck data you want out. Doing this reduces the amount of data sent over muxrpc, which speeds up loading
`
  return {
    initialQuery: json5.parse(defaultValue),
    initialValue: defaultValue
  }
}

function isValidQuery (query) {
  if (!Array.isArray(query)) return false
  if (!query.map(q => Object.keys(q)[0]).every(q => ['$filter', '$map', '$reduce'].includes(q))) return false

  return true
}
