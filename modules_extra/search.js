const h = require('../h')
const fs = require('fs')
const { Value, when } = require('@mmckegg/mutant')
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
    var _matches = searchFilter(query)

    const isLinearSearch = Value(false)
    const searched = Value(0)
    const matches = Value(0)
    const searchHeader = h('Search', [
      h('header', h('h1', query.join(' '))),
      when(isLinearSearch, 
        h('section.details', [ 
          h('div.searched', ['Searched: ', searched]),
          h('div.matches', [matches, ' matches']) 
        ])
      )
    ])
    var { container, content } = api.build_scroller({ prepend: searchHeader })
    container.id = path // helps tabs find this tab

    function matchesQuery (data) {
      searched.set(searched() + 1)
      var m = _matches(data)
      if(m) matches.set(matches() +1 )
      
      return m
    }

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
        if (/^no source/.test(err.message)) {
          isLinearSearch.set(true)
          return pull(
            u.next(api.sbot_log, {reverse: true, limit: 500, live: false}),
            pull.filter(matchesQuery)
          )
        }
      }),
      Scroller(container, content, renderMsg, false, false)
    )

    return container
  }
}

