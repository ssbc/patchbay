const fs = require('fs')
const h = require('../../h')

exports.gives = {
  helpers: { build_scroller: true }
}

exports.create = function (api) {
  return {
    helpers: { build_scroller }
  }

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
