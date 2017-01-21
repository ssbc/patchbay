const renderer = require('ssb-markdown')
const fs = require('fs')
const h = require('../h')
const ref = require('ssb-ref')

exports.needs = {
  blob_url: 'first',
  emoji_url: 'first'
}

exports.gives = {
  markdown: true,
  mcss: true
}

exports.create = function (api) {
  return {
    markdown,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
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
      toUrl: function (id) {
        if(ref.isBlob(id)) return api.blob_url(id)
        return '#'+(mentions[id]?mentions[id]:id)
      }
    })

    return md

  }

  function renderEmoji(emoji) {
    var url = api.emoji_url(emoji)
    if (!url) return ':' + emoji + ':'
    return '<img src="' + encodeURI(url) + '"'
      + ' alt=":' + escape(emoji) + ':"'
      + ' title=":' + escape(emoji) + ':"'
      + ' class="emoji">'
  }

}

