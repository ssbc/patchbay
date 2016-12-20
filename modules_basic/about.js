var h = require('../h')

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

    var { value } = msg
    var { content: about, author: authorId } = value
    var { about: aboutId, name, image, description } = about
    // TODO does about default to the message author?
    // var { about: aboutId = authorId, name, image, description } = about

    return h('About', [
      verb({ aboutId, authorId: msg.value.author }),
      profile({ aboutId, name, image, description })
    ])
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
}


function verb ({ aboutId, authorId }) {
  var content = authorId === aboutId
    ? 'self-identifies as'
    : ['identifies ', idLink(aboutId), ' as']

  return h('header', content)
}

function idLink (id) {
  if (!id) return null

  return h('a', {href:'#'+id}, id.slice(0,9) + '...')
}

function asLink (ln) {
  return typeof ln === 'string' ? ln : ln.link
}

