const nest = require('depnest')
const { h } = require('mutant')
const keyscroll = require('../../junk/keyscroll')

exports.gives = nest('app.html.scroller')

exports.create = function (api) {
  return nest('app.html.scroller', Scroller)

  function Scroller ({ prepend = [], content = null, append = [] } = {}) {
    content = content || h('section.content')

    const container = h('Scroller', { style: { overflow: 'auto' } }, [
      h('div.wrapper', [
        h('header', prepend),
        content,
        h('footer', append)
      ])
    ])

    container.scroll = keyscroll(content)

    return {
      content,
      container
    }
  }
}

