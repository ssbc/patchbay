var h = require('hyperscript')

exports.search_box = function (go) {

  var search = h('input.searchprompt', {
    type: 'search',
    onkeydown: function (ev) {
      switch (ev.keyCode) {
        case 13: // enter
          if (go(search.value, !ev.ctrlKey))
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

  return search
}
