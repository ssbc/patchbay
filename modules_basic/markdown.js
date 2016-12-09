var markdown = require('ssb-markdown')
var h = require('hyperscript')
var ref = require('ssb-ref')

//var plugs = require('../plugs')
//var blob_url = plugs.first(exports.blob_url = [])
//var emoji_url = plugs.first(exports.emoji_url = [])

exports.needs = {
  blob_url: 'first',
//  emoji_url: 'first'
}

exports.gives = 'markdown'

exports.create = function (api) {

//emoji is in extra, disable for a sec

//  function renderEmoji(emoji) {
//    var url = api.emoji_url(emoji)
//    if (!url) return ':' + emoji + ':'
//    return '<img src="' + encodeURI(url) + '"'
//      + ' alt=":' + escape(emoji) + ':"'
//      + ' title=":' + escape(emoji) + ':"'
//      + ' class="emoji">'
//  }

  return function (content) {
    if('string' === typeof content)
      content = {text: content}
    //handle patchwork style mentions.
    var mentions = {}
    if(Array.isArray(content.mentions))
      content.mentions.forEach(function (link) {
        if(link.name) mentions["@"+link.name] = link.link
      })

    var md = h('div.markdown')
    md.innerHTML = markdown.block(content.text, {
  //    emoji: renderEmoji,
      toUrl: function (id) {
        if(ref.isBlob(id)) return api.blob_url(id)
        return '#'+(mentions[id]?mentions[id]:id)
      }
    })

    return md

  }
}

