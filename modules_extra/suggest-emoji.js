//var plugs = require('../plugs')
//var emoji_url = plugs.first(exports.emoji_url = [])
//var emoji_names = plugs.first(exports.emoji_names = [])

exports.needs = {
  emoji_url: 'first',
  emoji_names: 'first'
}

exports.gives = 'suggest_mentions'

exports.create = function (api) {

  return function (word) {
    return function (cb) {
      if (word[0] !== ':' || word.length < 2) return cb()
      word = word.substr(1)
      if (word[word.length-1] === ':') word = word.substr(0, word.length-1)
      cb(null, api.emoji_names().filter(function (name) {
        return name.substr(0, word.length) === word
      }).slice(0, 50).map(function (emoji) {
        return {
          image: api.emoji_url(emoji),
          title: emoji,
          subtitle: emoji,
          value: ':' + emoji + ':'
        }
      }))
    }
  }

}
