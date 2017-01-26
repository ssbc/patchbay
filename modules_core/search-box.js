'use strict'
var h = require('hyperscript')

exports.needs = {
  suggest_search: 'map', //REWRITE
  build_suggest_box: 'first'
}

exports.gives  = 'search_box'

exports.create = function (api) {

  return function (go) {

    var input = h('input.searchprompt', {
      type: 'search',
      placeholder: 'Commands',
      onkeydown: ev => {
        switch (ev.keyCode) {
          case 13: // enter
            ev.stopPropagation()
            suggestBox.complete()

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

    input.activate = (sigil, ev) => {
      input.focus()
      ev.preventDefault()
      if (input.value[0] === sigil) {
        input.selectionStart = 1
        input.selectionEnd = input.value.length
      } else {
        input.value = sigil
      }
    }

    var suggestBox = api.build_suggest_box(input, api.suggest_search)

    return input
  }

}

