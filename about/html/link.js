var nest = require('depnest')
var { h } = require('mutant')

exports.gives = nest('about.html.link')

exports.needs = nest({
  'about.obs.name': 'first'
})

exports.create = function (api) {
  return nest('about.html.link', function (id, text = null) {
    return h('a', {href: id, title: id}, text || api.about.obs.name(id))
  })
}
