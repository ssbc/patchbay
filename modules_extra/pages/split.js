var h = require('hyperscript')

exports.needs = { page: 'first' }

exports.gives = 'page'

exports.create = function (api) {

  return function (path) {
    var m = /^split\s*\((.*)\)$/.exec(path)
    if(!m)
      return

    return h('div.row',
      m[1].split(',').map(function (e) {
        return api.page(e.trim())
      }).filter(Boolean)
    )
  }

}
