var h = require('hyperscript')
var suggest = require('suggest-box')
var pull = require('pull-stream')
var plugs = require('../plugs')
var sbot_query = plugs.first(exports.sbot_query = [])
var sbot_links2 = plugs.first(exports.sbot_links2 = [])

var channels = []

var signified = require('../plugs').first(exports.signified = [])

//TODO: this list should be generated from plugs
var builtinTabs = [
  '/public', '/private', '/notifications',
  '/network', '/query', '/versions'
].map(function (name) {
  return {
    title: name,
    value: name,
  }
})

exports.search_box = function (go) {

  var suggestBox
  var search = h('input.searchprompt', {
    type: 'search',
    placeholder: '?word, @key, #channel',
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
    suggestBox = suggest(search, function (word, cb) {
      if(/^#\w/.test(word))
        cb(null, channels.filter(function (chan) {
          return ('#'+chan.name).substring(0, word.length) === word
        })
        .map(function (chan) {
          var name = '#'+chan.name
          return {
            title: name,
            value: name,
            subtitle: chan.rank
          }
        }))
      else if(/^[@%]\w/.test(word)) {
        signified(word, function (_, names) {
          cb(null, names.map(function (e) {
            return {
              title: e.name + ':'+e.id.substring(0, 10),
              value: e.id,
              subtitle: e.rank
            }
          }))
        })
      } else if(/^\//.test(word)) {
        cb(null, builtinTabs.filter(function (name) {
          return name.value.substr(0, word.length) === word
        }))
      }
    }, {})
  }, 10)


  pull(
    sbot_query({query: [
      {$filter: {value: {content: {channel: {$gt: ''}}}}},
      {$reduce: {
        name: ['value', 'content', 'channel'],
        rank: {$count: true}
      }}
    ]}),
    pull.collect(function (err, chans) {
      if (err) return console.error(err)
      channels = chans
    })
  )

  return search
}



