const nest = require('depnest')
const { h, computed } = require('mutant')

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

  function avatar (id, size = 4) {
    const src = api.about.obs.imageUrl(id)
    const color = computed(src, src => src.match(/^http/) ? 'rgba(0,0,0,0)' : api.about.obs.color(id))

    const avatar = api.about.html.link(id,
      h('img', {
        style: { 'background-color': color },
        src
      })
    )
    avatar.classList.add('Avatar')
    avatar.style.setProperty('--avatar-size', isNaN(size) ? size : `${size}rem`)

    return avatar
  }
}
