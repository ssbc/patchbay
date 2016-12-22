var fs = require('fs')
var Path = require('path')
var h = require('../h')
var when = require('@mmckegg/mutant/when')

exports.needs = {
  blob_url: 'first',
  markdown: 'first'
}

exports.gives = {
  mcss: true,
  message_content: true
}

exports.create = function (api) {
  return {
    message_content,
    mcss: () => fs.readFileSync(Path.join(__dirname, 'about.mcss'), 'utf8')
  }

  function message_content (msg) {
    if (msg.value.content.type !== 'about') return

    var { content: about, author: authorId } = msg.value
    var { about: aboutId, name, image, description } = about
    // TODO does about default to the message author?
    // var { about: aboutId = authorId, name, image, description } = about

    return h('About', [
      Name({ aboutId, authorId, name }),
      Image({ aboutId, authorId, image }),
      Description({ aboutId, authorId, description })
    ])
  }

  function Name ({ aboutId, authorId, name }) {
    if (!name) return null
    return h('section -name', [
      h('header', ['refers to ', when(authorId === aboutId, 'self', targetLink(aboutId)), ' as ']),
      h('section', nameLink(aboutId, name))
    ])
  }

  function Image ({ aboutId, authorId, image }) {
    if (!image) return null
    return h('section -image', [
      h('header', ['portrays ', when(authorId === aboutId, 'self', targetLink(aboutId)), ' as ']),
      h('section', imageLink(aboutId, h('img', { src: api.blob_url(image) })))
    ])
  }

  function Description ({ aboutId, authorId, description }) {
    if (!description) return null
    return h('section -description', [
      h('header', ['describes ', when(authorId === aboutId, 'self', targetLink(aboutId)), ' as ']),
      h('section', api.markdown(description))
    ])
  }
}

function targetLink (aboutId) {
  if (!aboutId) return null
  const content = aboutId.slice(0, 9) + '...'
  return h(
    'a -target',
    { href: `#${aboutId}` },
    content
  )
}

function nameLink (aboutId, name) {
  if (!aboutId) return null
  return h(
    'a -name',
    { href: `#${aboutId}` },
    name
  )
}

function imageLink (aboutId, img) {
  if (!aboutId) return null
  return h(
    'a -image',
    { href: `#${aboutId}` },
    img
  )
}
