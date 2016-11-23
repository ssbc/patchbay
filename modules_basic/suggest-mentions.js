var pull = require('pull-stream')
function isImage (filename) {
  return /\.(gif|jpg|png|svg)$/i.test(filename)
}

var sbot_links2 = require('../plugs').first(exports.sbot_links2 = [])
var blob_url = require('../plugs').first(exports.blob_url = [])
var signified = require('../plugs').first(exports.signified = [])

exports.suggest_mentions = function (word, cb) {
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
}

//TODO: this list should be generated from plugs
var builtinTabs = [
  '/public', '/private', '/notifications',
  '/network', '/query', '/versions'
].map(function (name) {
  return {
    title: name,
    value: name,
  }
})

exports.suggest_search = function (query, cb) {
  if(/^[@%]\w/.test(query)) {
    signified(query, function (_, names) {
      cb(null, names.map(function (e) {
        return {
          title: e.name + ':'+e.id.substring(0, 10),
          value: e.id,
          subtitle: e.rank,
          rank: e.rank
        }
      }))
    })

  } else if(/^\//.test(query)) {
    cb(null, builtinTabs.filter(function (name) {
      return name.value.substr(0, query.length) === query
    }))
  } else cb()
}













