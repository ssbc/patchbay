var h = require('hyperscript')
var u = require('../util')
var suggest = require('suggest-box')
var cont = require('cont')
var mentions = require('ssb-mentions')
var lightbox = require('hyperlightbox')

var plugs = require('../plugs')

//var suggest         = plugs.map(exports.suggest = [])
var publish         = plugs.first(exports.publish = [])
var message_content = plugs.first(exports.message_content = [])
var message_confirm = plugs.first(exports.message_confirm = [])
var file_input      = plugs.first(exports.file_input = [])

exports.suggest = []

function id (e) { return e }

exports.message_compose = function (meta, prepublish, cb) {
  if('function' !== typeof prepublish)
    sbot = prepublish, prepublish = id
  var accessories
  meta = meta || {}
  if(!meta.type) throw new Error('message must have type')
  var ta = h('textarea')

  var blur
  ta.addEventListener('focus', function () {
    clearTimeout(blur)
    ta.style.height = '200px'
    accessories.style.display = 'block'
  })
  ta.addEventListener('blur', function () {
    //don't shrink right away, so there is time
    //to click the publish button.
    clearTimeout(blur)
    blur = setTimeout(function () {
      if(ta.value) return
      ta.style.height = '50px'
      accessories.style.display = 'none'
    }, 200)
  })

  ta.addEventListener('keydown', function (ev) {
    if(ev.keyCode === 13 && ev.ctrlKey) publish()
  })

  var files = []

  function publish() {
    meta.text = ta.value
    meta.mentions = mentions(ta.value).concat(files)
    try {
      meta = prepublish(meta)
    } catch (err) {
      return alert(err.message)
    }
    message_confirm(meta, function (err, msg) {
      ta.value = ''
      cb(err, msg)
    })
  }


  var composer =
    h('div.compose', h('div.column', ta,
      accessories = h('div.row.compose__controls',
        //hidden until you focus the textarea
        {style: {display: 'none'}},
        file_input(function (file) {
          files.push(file)

          var embed = file.type.indexOf('image/') === 0 ? '!' : ''
          ta.value += embed + '['+file.name+']('+file.link+')'
          console.log('added:', file)
        }),
        h('button', 'publish', {onclick: publish}))
      )
    )

  suggest(ta, function (word, cb) {
    cont.para(exports.suggest.map(function (fn) {
      return function (cb) { fn(word, cb) }
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

