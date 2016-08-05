var h = require('hyperscript')
var plugs = require('../plugs')
var avatar_name = plugs.first(exports.avatar_name = [])

var signifier = require('../plugs').first(exports.signifier = [])

exports.avatar_link = function (id, element) {

  var link = h('a.avatar', {href: "#"+id, title: id}, element)

  signifier(id, function (_, names) {
    if(names.length)
      link.title = names[0].name + '\n  '+id
  })

  return link
}

