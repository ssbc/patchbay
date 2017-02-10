const renderer = require('ssb-markdown')
const fs = require('fs')
const h = require('../../h')
const ref = require('ssb-ref')

exports.needs = {
  helpers: {
    blob_url: 'first',
    emoji_url: 'first'
  }
}

exports.gives = {
  helpers: { markdown: true }
}

exports.create = function (api) {
  return {
    helpers: { markdown }
  }

  function markdown (content) {
    if('string' === typeof content)
      content = {text: content}
    //handle patchwork style mentions.
    var mentions = {}
    if(Array.isArray(content.mentions))
      content.mentions.forEach(function (link) {
        if(link.name) mentions["@"+link.name] = link.link
      })

    var md = h('Markdown')
    md.innerHTML = renderer.block(content.text, {
      emoji: renderEmoji,
      toUrl: (id) => {
        if(ref.isBlob(id)) return api.helpers.blob_url(id)
        return '#'+(mentions[id]?mentions[id]:id)
      },
      imageLink: (id) => '#' + id
    })

    return md

  }

  function renderEmoji(emoji) {
    var url = api.helpers.emoji_url(emoji)
    if (!url) return ':' + emoji + ':'
    return '<img src="' + encodeURI(url) + '"'
      + ' alt=":' + escape(emoji) + ':"'
      + ' title=":' + escape(emoji) + ':"'
      + ' class="emoji">'
  }

}
