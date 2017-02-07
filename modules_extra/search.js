const h = require('../h')
const fs = require('fs')
const { Struct, Value, when, computed } = require('@mmckegg/mutant')
const u = require('../util')
const pull = require('pull-stream')
const Scroller = require('pull-scroll')
const TextNodeSearcher = require('text-node-searcher')

exports.needs = {
  build_scroller: 'first',
  message_render: 'first',
  sbot_log: 'first',
  sbot_fulltext_search: 'first'
}

exports.gives = {
  screen_view: true,
  mcss: true
}

var whitespace = /\s+/

function andSearch(terms, inputs) {
  for(var i = 0; i < terms.length; i++) {
    var match = false
    for(var j = 0; j < inputs.length; j++) {
      if(terms[i].test(inputs[j])) match = true
    }
    //if a term was not matched by anything, filter this one
    if(!match) return false
  }
  return true
}

function searchFilter(terms) {
  return function (msg) {
    var c = msg && msg.value && msg.value.content
    return c && (
      msg.key == terms[0] ||
      andSearch(terms.map(function (term) {
        return new RegExp('\\b'+term+'\\b', 'i')
      }), [c.text, c.name, c.title])
    )
  }
}

function createOrRegExp(ary) {
  return new RegExp(ary.map(function (e) {
    return '\\b'+e+'\\b'
  }).join('|'), 'i')
}

function highlight(el, query) {
  var searcher = new TextNodeSearcher({container: el})
  searcher.query = query
  searcher.highlight()
  return el
}

function fallback(reader) {
  var fallbackRead
  return function (read) {
    return function (abort, cb) {
      read(abort, function next(end, data) {
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

  return {
    screen_view,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function screen_view (path) {
    if (path[0] !== '?') return

    var queryStr = path.substr(1).trim()
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
    var { container, content } = api.build_scroller({ prepend: searchHeader })
    container.id = path // helps tabs find this tab

    function renderMsg(msg) {
      var el = api.message_render(msg)
      highlight(el, createOrRegExp(query))
      return el
    }

    pull(
      api.sbot_log({old: false}),
      pull.filter(matchesQuery),
      Scroller(container, content, renderMsg, true, false)
    )

    pull(
      u.next(api.sbot_fulltext_search, {query: queryStr, reverse: true, limit: 500, live: false}),
      fallback((err) => {
        if (err === true) {
          search.fulltext.isDone.set(true)
        } else if (/^no source/.test(err.message)) {
          search.isLinear.set(true)
          return pull(
            u.next(api.sbot_log, {reverse: true, limit: 500, live: false}),
            pull.through(() => searched.set(searched()+1)),
            pull.filter(matchesQuery)
          )
        }
      }),
      pull.through(() => search.matches.set(search.matches()+1)),
      Scroller(container, content, renderMsg, false, false)
    )

    return container
  }
}

