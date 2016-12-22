var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')
var TextNodeSearcher = require('text-node-searcher')

exports.needs = {
  message_render: 'first',
  sbot_log: 'first',
  sbot_fulltext_search: 'first'
}

exports.gives = 'screen_view'

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

  return function (path) {
    if(path[0] === '?') {
      var queryStr = path.substr(1).trim()
      var query = queryStr.split(whitespace)
      var _matches = searchFilter(query)

      var total = 0, matches = 0
      var usingLinearSearch = false

      var header = h('div.search_header', '')
      var content = h('div.column.scroller__content')
      var div = h('div.column.scroller',
        {style: {'overflow':'auto'}},
        h('div.scroller__wrapper',
          header,
          content
        )
      )

      function matchesQuery (data) {
        total++
        var m = _matches(data)
        if(m) matches++
        if(usingLinearSearch) {
          header.textContent = 'searched:'+total+', found:'+matches
        }
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
        Scroller(div, content, renderMsg, true, false)
      )

      pull(
        u.next(api.sbot_fulltext_search, {query: queryStr, reverse: true, limit: 500, live: false}),
        fallback(function (err) {
          if (/^no source/.test(err.message)) {
            usingLinearSearch = true
            return pull(
              u.next(api.sbot_log, {reverse: true, limit: 500, live: false}),
              pull.filter(matchesQuery)
            )
          }
        }),
        Scroller(div, content, renderMsg, false, false)
      )

      return div
    }
  }

}
