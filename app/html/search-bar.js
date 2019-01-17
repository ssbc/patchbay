const nest = require('depnest')
const { h } = require('mutant')
const addSuggest = require('suggest-box')

exports.gives = nest('app.html.searchBar')

exports.needs = nest({
  'app.sync.goTo': 'first',
  'about.async.suggest': 'first',
  'channel.async.suggest': 'first'
  // 'app.async.suggest': 'reduce' // TODO add ability to add to this
})

exports.create = function (api) {
  var _search

  return nest('app.html.searchBar', function searchBar () {
    if (_search) return _search

    function goToLocation (location, ev) {
      const prefixes = ['@', '#', '%', '&', '/', 'ssb:']

      if (location[0] === '?') {
        location = { page: 'search', query: location.substring(1) }
      } else if (prefixes.every(p => !location.startsWith(p))) {
        location = { page: 'search', query: location }
      }

      api.app.sync.goTo(location)
      if (!ev.ctrlKey) input.blur()
    }

    const input = h('input', {
      type: 'search',
      placeholder: '?search, @name, #channel',
      'ev-keyup': ev => {
        switch (ev.keyCode) {
          case 13: // enter
            goToLocation(input.value.trim(), ev)
            return
          case 27: // escape
            ev.preventDefault()
            input.blur()
        }
      }
    })

    input.addEventListener('suggestselect', ev => {
      input.value = ev.detail.id // HACK : this over-rides the markdown value
      goToLocation(input.value.trim(), ev)
    })

    _search = h('SearchBar', input)
    _search.input = input
    _search.activate = (sigil, ev) => {
      input.focus()
      ev.preventDefault()
      if (input.value[0] === sigil) {
        input.selectionStart = 1
        input.selectionEnd = input.value.length
      } else {
        input.value = sigil
      }
    }

    addSuggest(input, (inputText, cb) => {
      const char = inputText[0]
      const word = inputText.slice(1)

      if (char === '@') api.about.async.suggest(word, cb)
      if (char === '#') api.channel.async.suggest(word, cb)
      if (char === '/') cb(null, getPagesSuggestions(word))
    }, { cls: 'PatchSuggest' })

    // TODO extract - as in when something supplies something as a menuItem, this should also be auto-populated...
    function getPagesSuggestions (word) {
      const pages = [
        'blogs', 'calendar', 'posts', 'public', 'private', 'inbox', 'profile', 'notifications', 'settings', 'shortcuts',
        'network',
        'gatherings', 'chess', 'books', 'imageSearch', 'polls', 'query', 'dark-crystal', 'postRank', 'scry', 'scry/new'
      ]

      return pages
        .filter(page => ~page.indexOf(word))
        .sort((a, b) => a.indexOf(word) < b.indexOf(word) ? -1 : +1)
        .map(page => {
          return {
            title: '/' + page,
            id: '/' + page,
            value: '/' + page
          }
        })
    }

    return _search
  })
}
