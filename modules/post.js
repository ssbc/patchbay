var markdown = require('ssb-markdown')
var h = require('hyperscript')
var u = require('../util')
var ref = require('ssb-ref')

//render a message

var plugs = require('../plugs')
var message_link = plugs.first(exports.message_link = [])
var markdown = plugs.first(exports.markdown = [])

exports.message_content = function (data) {
  if(!data.value.content || !data.value.content.text) return

  var root = data.value.content.root
  var re = !root ? null : h('span', 're: ', message_link(root))

  return h('div',
    re,
    markdown(data.value.content)
  )

}














