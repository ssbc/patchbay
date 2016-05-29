var pull = require('pull-stream')
var cont = require('cont')
function isImage (filename) {
  return /\.(gif|jpg|png|svg)$/i.test(filename)
}

var sbot_links2 = require('../plugs').first(exports.sbot_links2 = [])

exports.suggest = cont.to(function (word, cb) {
  if(!/^[@%&!]/.test(word[0])) return cb()
  if(word.length < 2) return cb()

  var sigil = word[0]
  var embed = ((sigil === '!') ? '!' : '')
  if(embed) sigil = '&'
  if(word[0] !== '@') word = word.substring(1)

  pull(
    sbot_links2({query: [
      {$filter: {rel: ['mentions', {$prefix: word}], dest: {$prefix: sigil}}},
      {$reduce: {id: 'dest', name: ['rel', 1], rank: {$count: true}}}
    ]}),
    pull.collect(function (err, ary) {

      ary = ary
      .filter(function (e) {
        if(!embed) return true
        return isImage(e.name)
      }).sort(function (a, b) {
        return b.rank - a.rank
      }).map(function (e) {
        return {
          title: e.name + ': ' + e.id.substring(0,10)+' ('+e.rank+')',
          value: embed+'['+e.name+']('+e.id+')',
          rank: e.rank,
          image: isImage(e.name) ? 'http://localhost:7777/'+e.id : undefined
        }
      })
      cb(null, ary)
    })
  )
})

