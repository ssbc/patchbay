var markdown = require('ssb-markdown')
var h = require('hyperscript')
var u = require('../util')
var ref = require('ssb-ref')

//render a message

//var plugs = require('../plugs')
//var message_link = plugs.first(exports.message_link = [])
//var markdown = plugs.first(exports.markdown = [])
//

exports.needs = {
  message_link: 'first',
  markdown: 'first'
}

exports.gives = {
  message_content: true,
  message_title: true
}

exports.create = function (api) {
  return {
    message_content,
    message_title
  }

  function message_content (data) {
    if(!data.value.content || !data.value.content.text) return

    return h('div',
      api.markdown(data.value.content)
    )
  }

  function message_title (data) {
    var root = data.value.content && data.value.content.root
    return !root ? null : h('span', 're: ', api.message_link(root))
  }
}













