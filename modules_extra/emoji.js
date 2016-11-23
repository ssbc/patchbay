var emojis = require('emoji-named-characters')
var emojiNames = Object.keys(emojis)

var plugs = require('../plugs')
var blob_url = plugs.first(exports.blob_url = [])

exports.emoji_names = function () {
  return emojiNames
}

exports.emoji_url = function (emoji) {
  return emoji in emojis &&
    blob_url(emoji).replace(/\/blobs\/get/, '/img/emoji') + '.png'
}
