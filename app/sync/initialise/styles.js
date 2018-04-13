const nest = require('depnest')
// const insertCss = require('insert-css')
const compileCss = require('micro-css')
const { h, computed } = require('mutant')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'styles.css': 'reduce',
  'settings.obs.get': 'first'
})

exports.create = function (api) {
  return nest('app.sync.initialise', styles)

  function styles () {
    const css = values(api.styles.css()).join('\n')

    document.head.appendChild(
      h('style', {
        innerHTML: computed(api.settings.obs.get('patchbay.customStyles', ''), styles => {
          const customStyles = compileCss(styles)
          console.log(customStyles)
          return [css, customStyles].join('\n')
        })
      })
    )
  }
}

function values (object) {
  const keys = Object.keys(object)
  return keys.map(k => object[k])
}

