var pull = require('pull-stream')
var cont = require('cont')
function isImage (filename) {
  return /\.(gif|jpg|png|svg)$/i.test(filename)
}

var sbot_links2 = require('../plugs').first(exports.sbot_links2 = [])
var blob_url = require('../plugs').first(exports.blob_url = [])
var signified = require('../plugs').first(exports.signified = [])

exports.suggest = cont.to(function (word, cb) {
  if(!/^[%&@]\w/.test(word)) return cb()


  signified(word, function (err, names) {
    if(err) cb(err)
    else cb(null, names.map(function (e) {
      return {
        title: e.name + ': ' + e.id.substring(0,10)+' ('+e.rank+')',
        value: '['+e.name+']('+e.id+')',
        rank: e.rank,
        //TODO: avatar images...
      }
    }))
  })
})














