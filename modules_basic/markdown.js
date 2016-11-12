var markdown = require('ssb-markdown')
var h = require('hyperscript')
var ref = require('ssb-ref')

var blob_url = require('../plugs').first(exports.blob_url = [])

exports.markdown = function (content) {
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
    toUrl: function (id) {
      if(ref.isBlob(id)) return blob_url(id)
      return '#'+(mentions[id]?mentions[id]:id)
    }
  })

  return md

}

