var plugs = require('../plugs')
var h = require('hyperscript')

var screen_view = plugs.first(exports.screen_view = [])
var menu_items = plugs.map(exports.menu_items = [])

var status = h('div.status.error') //start off disconnected
var list = h('div.column', {style: 'display: none;'})

var menu = h('div.menu.row', list, status, {
  onmouseover: function (e) {
    list.style.display = 'flex'
  }, onmouseout: function () {
    list.style.display = 'none'
  }
})

exports.connection_status = function (err) {
  if(err) status.classList.add('error')
  else    status.classList.remove('error')
}

exports.app = function () {
  function hash() {
    return window.location.hash.substring(1)
  }

  var view = screen_view(hash() || 'tabs')

  var screen = h('div.screen.column', menu, view)

  menu_items().forEach(function (el) {
    list.appendChild(el)
  })

  window.onhashchange = function (ev) {
    var _view = view
    view = screen_view(hash() || 'tabs')

    if(_view) screen.replaceChild(view, _view)
    else      document.body.appendChild(view)
  }


  return screen

}

























