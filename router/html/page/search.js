const nest = require('depnest')
const { h, Struct, Value, when, computed } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const TextNodeSearcher = require('text-node-searcher')

const next = require('../../../junk/next-stepper')

exports.gives = nest('router.html.page')

exports.needs = nest({
  'main.html.scroller': 'first',
  'message.html.render': 'first',
  'sbot.pull': {
    log: 'first',
    search: 'first'
  }
})

var whitespace = /\s+/

function andSearch (terms, inputs) {
  for (var i = 0; i < terms.length; i++) {
    var match = false
    for (var j = 0; j < inputs.length; j++) {
      if (terms[i].test(inputs[j])) match = true
    }
    // if a term was not matched by anything, filter this one
    if (!match) return false
  }
  return true
}

function searchFilter (terms) {
  return function (msg) {
    var c = msg && msg.value && msg.value.content
    return c && (
      msg.key === terms[0] ||
      andSearch(terms.map(function (term) {
        return new RegExp('\\b' + term + '\\b', 'i')
      }), [c.text, c.name, c.title])
    )
  }
}

function createOrRegExp (ary) {
  return new RegExp(ary.map(function (e) {
    return '\\b' + e + '\\b'
  }).join('|'), 'i')
}

function highlight (el, query) {
  var searcher = new TextNodeSearcher({container: el})
  searcher.query = query
  searcher.highlight()
  return el
}

function fallback (reader) {
  var fallbackRead
  return function (read) {
    return function (abort, cb) {
      read(abort, function next (end, data) {
        if (end && reader && (fallbackRead = reader(end))) {
          reader = null
          read = fallbackRead
          read(abort, next)
        } else {
          cb(end, data)
        }
      })
    }
  }
}

exports.create = function (api) {
  return nest('router.html.page', searchPage)

  function searchPage (path) {
    if (path.match(/^[@#%\/]/)) return

    var queryStr = path.replace(/^\??/, '').trim()
    var query = queryStr.split(whitespace)
    var matchesQuery = searchFilter(query)

    const search = Struct({
      isLinear: Value(false),
      linear: Struct({
        checked: Value(0)
      }),
      fulltext: Struct({
        isDone: Value(false)
      }),
      matches: Value(0)
    })
    const hasNoFulltextMatches = computed([search.fulltext.isDone, search.matches],
      (done, matches) => done && matches === 0)

    const searchHeader = h('Search', [
      h('header', h('h1', query.join(' '))),
      when(search.isLinear,
        h('section.details', [
          h('div.searched', ['Searched: ', search.linear.checked]),
          h('div.matches', [search.matches, ' matches'])
        ]),
        h('section.details', [
          h('div.searched'),
          when(hasNoFulltextMatches, h('div.matches', 'No matches'))
        ])
      )
    ])
    var { container, content } = api.main.html.scroller({ prepend: searchHeader })
    container.id = path // helps tabs find this tab

    function renderMsg (msg) {
      var el = api.message.html.render(msg)
      highlight(el, createOrRegExp(query))
      return el
    }

    pull(
      api.sbot.pull.log({old: false}),
      pull.filter(matchesQuery),
      Scroller(container, content, renderMsg, true, false)
    )

    pull(
      next(api.sbot.pull.search, {query: queryStr, reverse: true, limit: 500, live: false}),
      fallback((err) => {
        if (err === true) {
          search.fulltext.isDone.set(true)
        } else if (/^no source/.test(err.message)) {
          search.isLinear.set(true)
          return pull(
            next(api.sbot_log, {reverse: true, limit: 500, live: false}),
            pull.through(() => search.linear.checked.set(search.linear.checked() + 1)),
            pull.filter(matchesQuery)
          )
        }
      }),
      pull.through(() => search.matches.set(search.matches() + 1)),
      Scroller(container, content, renderMsg, false, false)
    )

    return container
  }
}

