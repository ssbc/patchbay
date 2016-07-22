var plugs = require('../plugs')
var h = require('hyperscript')

var screen_view = plugs.first(exports.screen_view = [])

var status = h('div.status')

exports.connection_status = function (err) {
  if(err) status.classList.add('error')
  else    status.classList.remove('error')
}

exports.app = function () {
  function hash() {
    return window.location.hash.substring(1)
  }

  var view = screen_view(hash() || 'tabs')

  var screen = h('div.screen.column', status, view)

  window.onhashchange = function (ev) {
    var _view = view
    screen.replaceChild(view = screen_view(hash()), _view)
  }

  return screen

}


















