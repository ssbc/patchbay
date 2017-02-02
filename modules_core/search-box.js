'use strict'
const h = require('../h')
const fs = require('fs')


exports.needs = {
  suggest_search: 'map', //REWRITE
  build_suggest_box: 'first'
}

exports.gives = {
  search_box: true,
  mcss: true
}

exports.create = function (api) {

  return {
    search_box,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }
  
  function search_box (go) {
    const input = h('input', {
      type: 'search',
      placeholder: 'Commands',
      'ev-keyup': ev => {
        switch (ev.keyCode) {
          case 13: // enter
            console.log(ev)
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
    const search = h('Search', input)

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

    const suggestBox = api.build_suggest_box(input, api.suggest_search)

    return search
  }

}

