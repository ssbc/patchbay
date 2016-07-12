
var h = require('hyperscript')

function idLink (id) {
  return h('a', {href:'#'+id}, id)
}

exports.message_content = function (msg, sbot) {
  if(msg.value.content.type !== 'about') return

  if(!msg.value.content.image && !msg.value.content.name)
    return

  var about = msg.value.content
  var id = msg.value.content.about
  return h('p', 
    about.about === msg.value.author
      ? h('span', 'self-identifies') 
      : h('span', 'identifies ', idLink(id)),
    ' as ',
    h('a', {href:"#"+about.about},
      about.name || null,
      about.image
      ? h('img', {src:'http://localhost:7777/'+ encodeURIComponent(about.image.link)})
      : null
    )
  )

}




