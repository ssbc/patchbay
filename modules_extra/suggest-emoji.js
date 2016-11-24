var plugs = require('../plugs')
var emoji_url = plugs.first(exports.emoji_url = [])
var emoji_names = plugs.first(exports.emoji_names = [])

exports.suggest_mentions = function (word, cb) {
  if (word[0] !== ':' || word.length < 2) return cb()
  word = word.substr(1)
  if (word[word.length-1] === ':') word = word.substr(0, word.length-1)
  cb(null, emoji_names().filter(function (name) {
    return name.substr(0, word.length) === word
  }).slice(0, 50).map(function (emoji) {
    return {
      image: emoji_url(emoji),
      title: emoji,
      subtitle: emoji,
      value: ':' + emoji + ':'
    }
  }))
}
