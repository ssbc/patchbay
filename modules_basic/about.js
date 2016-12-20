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
    background-color: red
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

    return h('.About', {}, [
      verb({ aboutId, authorId: msg.value.author }),
      profile({ aboutId, name, image, description })
    ])
  }
}


function verb ({ aboutId, authorId }) {
  return authorId === aboutId
    ? h('span', 'self-identifies as')
    : h('span', ['identifies ', idLink(aboutId), ' as '])
}

function profile ({ aboutId, name, image, description }) {
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
  return h('a', {href:'#'+id}, id)
}

function asLink (ln) {
  return typeof ln === 'string' ? ln : ln.link
}

