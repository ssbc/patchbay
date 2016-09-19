var plugs = require('../plugs')
var h = require('hyperscript')

var menu_items = plugs.map(exports.menu_items = [])

var status = h('div.status.error') //start off disconnected
  var list = h('div.menu.column', {style: 'display: none;'})

var menu = h('div.column', status, list , {
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

exports.menu = function () {
  menu_items().forEach(function (el) {
    list.appendChild(el)
  })

  return menu
}



