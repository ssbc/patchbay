const fs = require('fs')
const h = require('../../h')
const { when } = require('mutant')

exports.needs = {
  helpers: {
    blob_url: 'first',
    markdown: 'first'
  }
}

exports.gives = {
  message: {
    content: true,
    content_mini: true
  }
}

exports.create = function (api) {
  return {
    message: {
      content,
      content_mini
    }
  }

  function content (msg) {
    if (msg.value.content.type !== 'about') return

    var { content: about, author: authorId } = msg.value
    var { about: aboutId, name, image, description } = about

    if (!aboutId) return null

    return h('About', [
      Name({ aboutId, authorId, name }),
      Image({ aboutId, authorId, image }),
      Description({ aboutId, authorId, description })
    ])
  }

  function content_mini (msg) {
    if (msg.value.content.type !== 'about') return

    var { content: about, author: authorId } = msg.value
    var { about: aboutId, name, image, description } = about

    if (!aboutId) return null
    if (image || description) return null

    return h('About', Name({ aboutId, authorId, name }))
  }


  function Name ({ aboutId, authorId, name }) {
    if (!name) return null
    return h('section -name', [
      h('header', when(authorId === aboutId,
        'self-identifies as',
        ['identifies ', targetLink(aboutId), ' as']
      )),
      h('section', h(
        'a -name',
        { href: `#${aboutId}` },
        name
      ))
    ])
  }

  function Image ({ aboutId, authorId, image }) {
    if (!image) return null
    return h('section -image', [
      h('header', when(authorId === aboutId,
        'self-portrays as',
        ['portrays ', targetLink(aboutId), ' as']
      )),
      h('section', h(
        'a -image',
        { href: `#${aboutId}` },
        h('img', { src: api.helpers.blob_url(image) })
      ))
    ])
  }

  function Description ({ aboutId, authorId, description }) {
    if (!description) return null
    return h('section -description', [
      h('header', when(authorId === aboutId,
        'self-describes as',
        ['describes ', targetLink(aboutId), ' as']
      )),
      h('section', api.helpers.markdown(description))
    ])
  }
}

function targetLink (aboutId) {
  const content = aboutId.slice(0, 9) + '...'
  return h(
    'a -target',
    { href: `#${aboutId}` },
    content
  )
}
