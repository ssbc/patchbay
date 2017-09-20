const nest = require('depnest')
const { h } = require('mutant')
const addSuggest = require('suggest-box')

exports.gives = nest('app.html.searchBar')

exports.needs = nest({
  'app.sync.goTo': 'first',
  'about.async.suggest': 'first',
  'channel.async.suggest': 'first'
})

exports.create = function (api) {
  var _search

  return nest('app.html.searchBar', function searchBar () {
    if (_search) return _search

    const getProfileSuggestions = api.about.async.suggest()
    const getChannelSuggestions = api.channel.async.suggest()

    function goToLocation(location, ev) {
        if (location[0] == '?')
            location = { page: 'search', query: location.substring(1) }
        else if (!['@', '#', '%', '&', '/'].includes(location[0]))
            location = { page: 'search', query: location }

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
      input.value = ev.detail.id  // HACK : this over-rides the markdown value
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
      if (inputText[0] === '@') {
        cb(null, getProfileSuggestions(inputText.slice(1)))
      } else if (inputText[0] === '#') {
        cb(null, getChannelSuggestions(inputText.slice(1)))
      }
    }, {cls: 'PatchSuggest'})

    return _search
  })
}
