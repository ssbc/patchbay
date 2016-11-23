var h = require('hyperscript')
var suggest = require('suggest-box')
var pull = require('pull-stream')
var plugs = require('../plugs')
var sbot_query = plugs.first(exports.sbot_query = [])
var sbot_links2 = plugs.first(exports.sbot_links2 = [])
var suggest_search = plugs.asyncConcat(exports.suggest_search = [])

var channels = []


exports.search_box = function (go) {

  var suggestBox
  var search = h('input.searchprompt', {
    type: 'search',
    placeholder: 'Commands',
    onkeydown: function (ev) {
      switch (ev.keyCode) {
        case 13: // enter
          if (suggestBox && suggestBox.active) {
            suggestBox.complete()
            ev.stopPropagation()
          }
          if (go(search.value.trim(), !ev.ctrlKey))
            search.blur()
          return
        case 27: // escape
          ev.preventDefault()
          search.blur()
          return
      }
    }
  })

  search.activate = function (sigil, ev) {
    search.focus()
    ev.preventDefault()
    if (search.value[0] === sigil) {
      search.selectionStart = 1
      search.selectionEnd = search.value.length
    } else {
      search.value = sigil
    }
  }

  var suggestions = {}

  // delay until the element has a parent
  setTimeout(function () {
    suggestBox = suggest(search, suggest_search, {})
  }, 10)

  return search
}
