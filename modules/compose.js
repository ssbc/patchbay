var h = require('hyperscript')
var u = require('../util')
var suggest = require('suggest-box')
var cont = require('cont')
var mentions = require('ssb-mentions')
var lightbox = require('hyperlightbox')

exports.suggest = []
exports.publish = []
exports.message_content = []
exports.message_confirm = []

//this decorator expects to be the first
exports.message_compose = function (meta, sbot) {
  meta = meta || {}
  if(!meta.type) throw new Error('message must have type')
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
      u.firstPlug(exports.message_confirm, meta, sbot)
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

      cb(null, results)
    })
  }, {})

  return composer

}





