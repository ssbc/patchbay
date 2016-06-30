var h = require('hyperscript')
var suggest = require('suggest-box')
var pull = require('pull-stream')
var plugs = require('../plugs')
var sbot_query = plugs.first(exports.sbot_query = [])
var sbot_links2 = plugs.first(exports.sbot_links2 = [])

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

  var suggestions = {}

  // delay until the element has a parent
  setTimeout(function () {
    suggestBox = suggest(search, suggestions)
  }, 10)

  pull(
    sbot_query({query: [
      {$filter: {value: {content: {channel: {$gt: ''}}}}},
      {$reduce: {
        channel: ['value', 'content', 'channel'],
        posts: {$count: true}
      }}
    ]}),
    pull.collect(function (err, chans) {
      if (err) return console.error(err)
      suggestions['#'] = chans.map(function (chan) {
        var name = '#' + chan.channel
        return {
          title: name,
          value: name,
          subtitle: chan.posts
        }
      })
    })
  )

  pull(
    sbot_links2({query: [
      {$filter: {
        dest: {$prefix: '@'},
        rel: ['mentions', {$gt: '@'}]}
      },
      {$reduce: {
        id: 'dest',
        name: ['rel', 1],
        rank: {$count: true}}
      }
    ]}),
    pull.collect(function (err, links) {
      if (err) return console.error(err)
      suggestions['@'] = links.map(function (e) {
        return {
          title: e.name,
          value: e.id,
          subtitle: e.id + ' (' + e.rank + ')',
          rank: e.rank
        }
      }).sort(function (a, b) {
        return b.rank - a.rank
      })
    })
  )

  return search
}
