const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('about.html.avatar')

exports.needs = nest({
  'about.obs': {
    color: 'first',
    imageUrl: 'first'
  },
  'about.html.link': 'first'
})

exports.create = function (api) {
  return nest('about.html.avatar', avatar)

  function avatar (id) {
    return api.about.html.link(id,
      h('img', {
        className: 'Avatar',
        style: { 'background-color': api.about.obs.color(id) },
        src: api.about.obs.imageUrl(id)
      })
    )
  }
}

