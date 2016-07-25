
var h = require('hyperscript')

function idLink (id) {
  return h('a', {href:'#'+id}, id)
}

function asLink (ln) {
  return 'string' === typeof ln ? ln : ln.link
}

var blob_url = require('../plugs').first(exports.blob_url = [])

exports.message_content = function (msg) {
  if(msg.value.content.type !== 'about') return

  if(!msg.value.content.image && !msg.value.content.name)
    return

  var about = msg.value.content
  var id = msg.value.content.about
  return h('p', 
    about.about === msg.value.author
      ? h('span', 'self-identifies ')
      : h('span', 'identifies ', idLink(id)),
    ' as ',
    h('a', {href:"#"+about.about},
      about.name || null,
      about.image
      ? h('img.avatar--fullsize', {src: blob_url(about.image)})
      : null
    )
  )

}





