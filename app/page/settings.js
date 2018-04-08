const nest = require('depnest')
const { h } = require('mutant')
const insertCss = require('insert-css')
const compileCss = require('micro-css')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.settings': true
})

exports.needs = nest({
  'app.sync.goTo': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.settings': publicPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'settings' })
    }, '/settings')
  }

  function publicPage (location) {
    const styles = h('textarea')
    return h('SettingsPage', [
      styles,
      h('button', {'ev-click': () => peachify(styles)}, 'peachify')
    ])

    function peachify (styles) {
     const css = compileCss(styles.value)
      //   body{
      //     background-color: peachpuff; 
      //     color: indigo; }

      //   a:link, a:visited, a:active  {
      //     color: #116a6a; }
      // `
      insertCss(css)
    }
  }

}
