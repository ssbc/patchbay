const { h } = require('mutant')
const nest = require('depnest')

exports.gives = nest('main.html.scroller')

exports.create = function (api) {
  return nest('main.html.scroller', build_scroller)

  function build_scroller ({ prepend = [], append = [] } = {}) {
    const content = h('section.content')

    const container = h('Scroller', { style: { overflow: 'auto' } }, [
      h('div.wrapper', [
        h('header', prepend),
        content,
        h('footer', append)
      ])
    ])

    return {
      content,
      container
    }
  }
}

