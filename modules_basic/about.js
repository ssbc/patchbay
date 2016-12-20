var h = require('../h')

//var blob_url = require('../plugs').first(exports.blob_url = [])

exports.needs = {
  blob_url: 'first'
}

exports.gives = {
  mcss: true,
  message_content: true
}

var mcss = `
  About {
    display: flex
    flex-wrap: wrap

    header {
      margin-right: .4rem
    }
  }
`

exports.create = function (api) {
  return { 
    message_content,
    mcss: function () { return mcss }
  }

  function message_content (msg) {
    if(msg.value.content.type !== 'about') return

    var about = msg.value.content
    var { about: aboutId, name, image, description } = about

    // if(!image && !name) return

    return h('div', {className: 'About'}, [
      verb({ aboutId, authorId: msg.value.author }),
      profile({ aboutId, name, image, description, api })
    ])
  }
}


function verb ({ aboutId, authorId }) {
  var content = authorId === aboutId
    ? 'self-identifies as'
    : ['identifies ', idLink(aboutId), ' as']

  return h('header', content)
}

function profile ({ aboutId, name, image, description, api }) {
  return h('div', [
    name
      ? h('a', {href:'#'+aboutId}, name)
      : null,
    image
      ? h('a', {href:'#'+aboutId}, h('img.avatar--fullsize', {src: api.blob_url(image)}))
      : null,
    description || null
  ])
}

function idLink (id) {
  if (!id) return null

  return h('a', {href:'#'+id}, id.slice(0,9) + '...')
}

function asLink (ln) {
  return typeof ln === 'string' ? ln : ln.link
}

