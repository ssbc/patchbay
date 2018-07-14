const nest = require('depnest')
const { h, computed, map } = require('mutant')
const ref = require('ssb-ref')

exports.gives = nest('message.html.action')

exports.needs = nest({
  'about.obs.name': 'first',
  'message.obs.likes': 'first'
})

exports.create = (api) => {
  return nest('message.html.action', likes)

  function likes (msg) {
    if (!ref.isMsgId(msg.key)) return

    const symbol = '\u2713' // tick  🗸

    var likes = api.message.obs.likes(msg.key)

    var body = computed(likes, likes => likes.length > 4
      ? likes.length + ' ' + symbol
      : Array(likes.length).fill(symbol).join('')
    )

    var names = map(likes, id => api.about.obs.name(id))
    var title = computed(names, names => names.map(n => '@' + n).join('\n'))

    return h('a.likes', { title }, body)
  }
}
