var h = require('hyperscript')
var suggest = require('suggest-box')
var cont = require('cont')
var mentions = require('ssb-mentions')
exports.suggest = []

//this decorator expects to be the first
exports.message_compose = function (el, meta, sbot) {
  if(el) return el

  meta = meta || {}
  var ta = h('textarea')
    //h('pre.editable.fixed', 'HELLO')
  //ta.setAttribute('contenteditable', '')

  var blur
  ta.addEventListener('focus', function () {
    clearTimeout(blur)
    ta.style.height = '200px'
  })
  ta.addEventListener('blur', function () {
    //don't shrink right away, so there is time
    //to click the publish button.
    clearTimeout(blur)
    blur = setTimeout(function () {
      ta.style.height = '50px'
    }, 200)
  })

  var composer =
  h('div', h('div.column', ta,
    h('button', 'publish', {onclick: function () {
      meta.text = ta.value
      meta.mentions = mentions(ta.value)
      alert(JSON.stringify(meta, null, 2))
    }})))

  suggest(ta, function (word, cb) {
    cont.para(exports.suggest.map(function (fn) {
      return function (cb) { fn(word, sbot, cb) }
    }))
    (function (err, results) {
      if(err) console.error(err)
      results = results.reduce(function (ary, item) {
        return ary.concat(item)
      }, []).sort(function (a, b) {
        return b.rank - a.rank
      }).filter(Boolean)

      console.log('RESULTS', results)
      cb(null, results)
    })
  }, {})

  return composer

}


