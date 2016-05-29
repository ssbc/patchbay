var markdown = require('ssb-markdown')
var h = require('hyperscript')
var u = require('../util')
var ref = require('ssb-ref')

//render a message

var plugs = require('../plugs')
var message_link = plugs.first(exports.message_link = [])

exports.message_content = function (data, sbot) {
  if(!data.value.content || !data.value.content.text) return

  var root = data.value.content.root
  var re = !root ? null : h('span', 're:', message_link(root))

  var content = h('div')
  var d = h('div', re, content)

  var mentions = {}
  if(Array.isArray(data.value.content.mentions))
  data.value.content.mentions.forEach(function (link) {
    if(link.name) mentions["@"+link.name] = link.link
  })

  content.innerHTML =
    markdown.block(data.value.content.text, {toUrl: function (id) {
      if(ref.isBlob(id))
        return 'http://localhost:7777/'+encodeURIComponent(id)
      return '#'+(mentions[id]?mentions[id]:id)
    }})
  return d
}








