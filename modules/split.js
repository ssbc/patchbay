var h = require('hyperscript')

var screen_view = 
  require('../plugs').first(exports._screen_view = [])

exports.screen_view = function (path) {
  var m = /^split\s*\((.*)\)$/.exec(path)
  if(!m)
    return

  return h('div.row',
    m[1].split(',').map(function (e) {
      return screen_view(e)
    }).filter(Boolean)
  )
}

