const nest = require('depnest')
const { h } = require('mutant')
const fs = require('fs')
const { join } = require('path')

const rawMd = fs.readFileSync(join(__dirname, './SHORTCUTS.md'), 'utf8')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.shortcuts': true
})

exports.needs = nest({
  'app.sync.goTo': 'first',
  'message.html.markdown': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.shortcuts': shortcutsPage
  })

  function menuItem () {
    return h('a', {
      'ev-click': () => api.app.sync.goTo({ page: 'shortcuts' })
    }, '/shortcuts')
  }

  function shortcutsPage (location) {
    const page = h('Shortcuts', [
      api.message.html.markdown(rawMd)
    ])

    page.title = '/shortcuts'
    return page
  }
}
