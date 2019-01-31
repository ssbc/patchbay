const nest = require('depnest')
const extend = require('xtend')
const { isFeed, isBlob } = require('ssb-ref')
const { h } = require('mutant')

exports.gives = nest('message.html.render')

exports.needs = nest({
  'about.html.link': 'first',
  'blob.sync.url': 'first',
  'message.html': {
    decorate: 'reduce',
    layout: 'first'
  }
})

exports.create = function (api) {
  return nest('message.html.render', about)

  function about (msg, opts) {
    // TODO write schemas for different sorts of about message
    if (msg.value.content.type !== 'about') return

    const { name, description, image, about } = msg.value.content
    if (!name && !description && !image) return
    if (!isFeed(about)) return
    // mix : note this looked like it was intended to deal with all about message but the logic sucked
    // I've made it explicitly handle only about messages for people, as that's what it was actually doing

    const element = api.message.html.layout(msg, extend({
      content: renderContent(msg),
      layout: 'default'
    }, opts))

    return api.message.html.decorate(element, { msg })
  }

  function renderContent (msg) {
    const { author, content } = msg.value
    var { about, link, name, description, image } = content
    if (!about) return

    // TODO : build better normalizers
    if (image && isBlob(image.link)) image = image.link
    about = about || link

    const metaData = [
      typeof name === 'string'
        ? h('div', [ h('strong', 'Name: '), name ])
        : undefined,
      typeof description === 'string'
        ? h('div', [ h('strong', 'Description: '), description ])
        : undefined,
      typeof image === 'string'
        ? h('img', { src: api.blob.sync.url(image), style: { 'margin-top': '.5rem' } })
        : undefined
    ]

    // if (!isFeed(about)) {
    //   return [
    //     h('p', [
    //       'Describes ',
    //       h('a', { href: about }, [about.slice(0, 7), '...']),
    //       ' as: '
    //     ]),
    //     ...metaData
    //   ]
    // }

    const target = author === about
      ? 'themself '
      : api.about.html.link(about)

    return [
      h('p', [
        'Declares the following about ',
        target
      ]),
      ...metaData
    ]
  }
}
