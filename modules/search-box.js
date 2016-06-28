var h = require('hyperscript')
var suggest = require('suggest-box')
var pull = require('pull-stream')
var plugs = require('../plugs')
var sbot_query = plugs.first(exports.sbot_query = [])

exports.search_box = function (go) {

  var search = h('input.searchprompt', {
    type: 'search',
    onkeydown: function (ev) {
      switch (ev.keyCode) {
        case 13: // enter
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

  /*
  var suggestions = []

  pull(
    sbot_query({query: [
      {$map: ['value', 'content', 'channel']},
      {$filter: {$prefix: ''}}
    ]}),
    pull.unique(),
    pull.drain(function (chan) {
      console.log('chan', chan)
      suggestions.push({title: '#'+chan, value: '#'+chan})
    })
  )

  // delay until the element has a parent
  setTimeout(function () {
    suggest(search, {'#': suggestions})
  }, 10)
  */

  return search
}
