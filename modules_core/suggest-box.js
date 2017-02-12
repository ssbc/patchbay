const fs = require('fs')
const h = require('../h')
const onload = require('on-load')
const { para } = require('cont')
const Suggest = require('suggest-box')

exports.gives = {
  build_suggest_box: true,
  css: true
}

exports.create = function (api) {
  return {
    build_suggest_box,
    css: () => fs.readFileSync(__filename.replace(/js$/, 'css'), 'utf8') // NOTE css
  }

  function build_suggest_box (inputNode, asyncSuggesters, opts = {}) {
    function suggester (inputText, cb) {
      para(asyncSuggesters(inputText))
        ((err, ary) => {
          if(err) return cb(err)

          var suggestions = ary.filter(Boolean).reduce((a, b) => a.concat(b), [])
          cb(null, suggestions)
        })
    }

    var suggestBox
    onload(inputNode, (el) => {
      suggestBox = Suggest(el, suggester, opts)
    })

    // HACK (mix) : onload is needed because Suggest demands a parent node.
    // I've chosen this over forcing users to pass a callback
    return {
      complete: () => suggestBox.complete()
    }
  }
}

