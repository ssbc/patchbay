const nest = require('depnest')
const { h } = require('mutant')
const { version } = require('../../../package.json')

exports.gives = nest({
  'app.html.settings': true
})

exports.create = function (api) {
  return nest({
    'app.html.settings': versionsData
  })

  function versionsData () {
    return {
      title: 'Installer version',
      body: h('Version', [
        h('p', [
          h('code', process.platform),
          ' version ',
          h('code', version)
        ])
      ])
    }
  }
}
