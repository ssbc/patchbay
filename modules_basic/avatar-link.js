var h = require('hyperscript')

exports.needs = {signifier: 'first'}

exports.gives = 'avatar_link'

exports.create = function (api) {
  return function (id, element) {

    var link = h('a.avatar', {href: "#"+id, title: id}, element)

    api.signifier(id, function (_, names) {
      if(names.length)
        link.title = names[0].name + '\n  '+id
    })

    return link
  }
}



