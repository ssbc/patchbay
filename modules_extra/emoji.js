var emojis = require('emoji-named-characters')
var emojiNames = Object.keys(emojis)

exports.needs = { blob_url: 'first' }
exports.gives = { emoji_names: true, emoji_url: true }

exports.create = function (api) {
  return {
    emoji_names: function () {
      return emojiNames
    },
    emoji_url: function (emoji) {
      return emoji in emojis &&
        api.blob_url(emoji).replace(/\/blobs\/get/, '/img/emoji') + '.png'
    }
  }
}

