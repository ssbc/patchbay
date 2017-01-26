const fs = require('fs')
const h = require('../h')
const { para } = require('cont')
const suggest = require('suggest-box')

exports.needs = {}

exports.gives = {
  build_suggest_box: true,
  css: true
}

exports.create = function (api) {
  return {
    build_suggest_box,
    css: () => fs.readFileSync(__filename.replace(/js$/, 'css'), 'utf8') //NOTE css
  }

  function build_suggest_box (inputNode, asyncSuggester, opts = {}) {
    // NOTE - suggest expects inputNode to have parentNode available
    var container = h('SuggestBox', inputNode)

    function suggester (inputText, cb) {
      para(asyncSuggester(inputText))
        ((err, ary) => {
          if(err) return cb(err)

          var suggestions = ary.filter(Boolean).reduce((a, b) => a.concat(b), [])
          cb(null, suggestions)
        })
    }

    var suggestBox = suggest(inputNode, suggester, opts)

    return suggestBox // NOTE suggestBox.el = input

  }
}

