'use strict'
var h = require('hyperscript')

exports.needs = {
  suggest_search: 'map', //REWRITE
  build_suggest_box: 'first'
}

exports.gives  = 'search_box'

exports.create = function (api) {

  return function (go) {

    var search = h('input.searchprompt', {
      type: 'search',
      placeholder: 'Commands',
      onkeydown: ev => {
        switch (ev.keyCode) {
          case 13: // enter
            ev.stopPropagation()
            suggestBox.complete()

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

    search.activate = (sigil, ev) => {
      search.focus()
      ev.preventDefault()
      if (search.value[0] === sigil) {
        search.selectionStart = 1
        search.selectionEnd = search.value.length
      } else {
        search.value = sigil
      }
    }

    var suggestBox = api.build_suggest_box(search, api.suggest_search)

    return search
  }

}

