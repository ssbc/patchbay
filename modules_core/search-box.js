'use strict'
var cont = require('cont')
var h = require('hyperscript')
var suggest = require('suggest-box')

exports.needs = {
  sbot_query: 'first', sbot_links2: 'first',
  suggest_search: 'map' //REWRITE
}

exports.gives  = 'search_box'

exports.create = function (api) {

  return function (go) {

    var suggestBox
    var search = h('input.searchprompt', {
      type: 'search',
      placeholder: 'Commands',
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

    // delay until the element has a parent
    setTimeout(function () {
      suggestBox = suggest(search, function (word, cb) {
        cont.para(api.suggest_search(word))
          (function (err, ary) {
            if(err) return cb(err)

            cb(null, ary.filter(Boolean).reduce(function (a, b) {
              return a.concat(b)
            }, []))
          })
      }, {})
    }, 10)

    return search
  }

}

