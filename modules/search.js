var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')
var TextNodeSearcher = require('text-node-searcher')

var plugs = require('../plugs')
var message_render = plugs.first(exports.message_render = [])
var sbot_log = plugs.first(exports.sbot_log = [])
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

exports.screen_view = function (path) {
  if(path[0] === '?') {
    var query = path.substr(1).trim().split(whitespace)
    var _matches = searchFilter(query)

    var total = 0, matches = 0

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
      header.textContent = 'searched:'+total+', found:'+matches
      return m
    }



    function renderMsg(msg) {
      var el = message_render(msg)
      highlight(el, createOrRegExp(query))
      return el
    }

    pull(
      sbot_log({old: false}),
      pull.filter(matchesQuery),
      Scroller(div, content, renderMsg, true, false)
    )

    pull(
      u.next(sbot_log, {reverse: true, limit: 500, live: false}),
      pull.filter(matchesQuery),
      Scroller(div, content, renderMsg, false, false)
    )

    return div
  }
}









