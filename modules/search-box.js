var h = require('hyperscript')
var suggest = require('suggest-box')
var pull = require('pull-stream')
var plugs = require('../plugs')
var sbot_query = plugs.first(exports.sbot_query = [])

exports.search_box = function (go) {

  var suggestBox
  var search = h('input.searchprompt', {
    type: 'search',
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

  pull(
    sbot_query({query: [
      {$map: {channel: ['value', 'content', 'channel']}},
      {$reduce: {channel: 'channel', posts: {$count: true}}}
    ]}),
    pull.collect(function (err, chans) {
      if (err) return console.error(err)
      var suggestions = chans.map(function (chan) {
        var name = '#' + chan.channel
        if (name) return {
          title: name,
          value: name,
          subtitle: chan.posts
        }
      }).filter(Boolean)
      suggestBox = suggest(search, {'#': suggestions})
    })
  )

  return search
}
