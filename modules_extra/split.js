var h = require('hyperscript')

//var screen_view = 
//  require('../plugs').first(exports._screen_view = [])


exports.needs = {
  screen_view: 'first'
}

exports.gives = 'screen_view'

exports.create = function (api) {

  return function (path) {
    var m = /^split\s*\((.*)\)$/.exec(path)
    if(!m)
      return

    return h('div.row',
      m[1].split(',').map(function (e) {
        return api.screen_view(e.trim())
      }).filter(Boolean)
    )
  }

}
