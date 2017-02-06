const fs = require('fs')
const h = require('../../h')

exports.gives = {
  build_scroller: true,
  mcss: true
}

exports.create = function (api) {
  return {
    build_scroller,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
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

