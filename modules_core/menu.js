const h = require('hyperscript')

exports.needs = { menu_items: 'map' }

exports.gives = {
  connection_status: true,
  menu: true,
  menu_items: true
}

exports.create = function (api) {
  const { menu_items } = api

  var status = h('div.status.error') //start off disconnected
  var list = h('div.menu.column', {style: 'display: none;'})

  var menu = h('div.column', {
    onmouseover: () => list.style.display = 'flex',
    onmouseout: () => list.style.display = 'none'
  }, [
    status, 
    list
  ])

  setTimeout(function () {
    menu_items().forEach(function (el) {
      if(el)
        list.appendChild(el)
    })
  }, 0)

  return {
    connection_status: (err) => {
      if(err) status.classList.add('error')
      else    status.classList.remove('error')
    },
    menu: () => menu,
    menu_items: () => null
  }
}


