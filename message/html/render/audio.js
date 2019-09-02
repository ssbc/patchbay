const nest = require('depnest')
const extend = require('xtend')
const { h } = require('mutant')
const { isAudio } = require('ssb-audio-schema')

exports.gives = nest('message.html.render')

exports.needs = nest({
  'blob.sync.url': 'first',
  'message.html': {
    decorate: 'reduce',
    layout: 'first'
  }
})

exports.create = function (api) {
  return nest('message.html.render', audio)

  function audio (msg, opts) {
    if (!isAudio(msg)) return

    const element = api.message.html.layout(msg, extend({
      content: renderContent(msg),
      layout: 'default'
    }, opts))

    return api.message.html.decorate(element, { msg })
  }

  function renderContent (msg) {
    const { blob } = msg.value.content

    return h('div', [
      h('audio', { src: api.blob.sync.url(blob), controls: true })
    ])
  }
}
