const nest = require('depnest')
const { h } = require('mutant')
const addSuggest = require('suggest-box')

exports.gives = nest('main.html.search')

exports.needs = nest({
  'about.async.suggest': 'first',
  'channel.async.suggest': 'first'
})

exports.create = function (api) {

  return nest('main.html.search', search)
  
  function search (go) {

    const getProfileSuggestions = api.about.async.suggest()
    const getChannelSuggestions = api.channel.async.suggest()

    const input = h('input', {
      type: 'search',
      placeholder: '?search, @name, #channel',
      'ev-keyup': ev => {
        switch (ev.keyCode) {
          case 13: // enter
            if (go(input.value.trim(), !ev.ctrlKey))
              input.blur()
            return
          case 27: // escape
            ev.preventDefault()
            input.blur()
            return
        }
      }
    })
    input.go = go // crude navigation api
    input.addEventListener('suggestselect', ev => {
      input.value = ev.detail.id  // HACK : this over-rides the markdown value

      // if (go(input.value.trim(), !ev.ctrlKey))
      //   input.blur()
    })
    const search = h('Search', input)

    search.input = input
    search.activate = (sigil, ev) => {
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
    }, {cls: 'SuggestBox'})

    return search
  }

}



