var markdown = require('ssb-markdown')
var h = require('hyperscript')

//render a message

exports.message_content = function (data, sbot) {
  if(data.value.content && data.value.content.text) {
    var d = h('div'/*, data.value.root ? */)
    d.innerHTML =
      markdown.block(data.value.content.text, data.value.content.mentions)
    return d
  }
}




