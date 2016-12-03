var plugs = require('../plugs')
var h = require('hyperscript')

module.exports = {
  needs: {menu_items: 'map'},
  gives: {connection_status: true, menu: true},
  create: function (api) {

    var menu_items = api.menu_items //plugs.map(exports.menu_items = [])

    var status = h('div.status.error') //start off disconnected
    var list = h('div.menu.column', {style: 'display: none;'})

    var menu = h('div.column', status, list , {
      onmouseover: function (e) {
        list.style.display = 'flex'
      }, onmouseout: function () {
        list.style.display = 'none'
      }
    })

    return {
      connection_status: function (err) {
        if(err) status.classList.add('error')
        else    status.classList.remove('error')
      },
      menu: function () {
        menu_items().forEach(function (el) {
          if(el)
            list.appendChild(el)
        })
      }
    }
  }
}




