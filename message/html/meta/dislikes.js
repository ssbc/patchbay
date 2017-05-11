const nest = require('depnest')
const { h, computed, map } = require('mutant')
const ref = require('ssb-ref')

exports.gives = nest('message.html.meta')

exports.needs = nest({
  'about.obs.name': 'first',
  'message.obs.dislikes': 'first'
})

exports.create = (api) => {
  return nest('message.html.meta', dislikes)

  function dislikes (msg) {
    if (!ref.isMsgId(msg.key)) return

    const symbol = '\u2715' // cross  

    var dislikes = api.message.obs.dislikes(msg.key)

    var body = computed(dislikes, dislikes => dislikes.length > 4
      ? dislikes.length + ' ' + symbol
      : Array(dislikes.length).fill(symbol).join('')
    )

    var names = map(dislikes, id => api.about.obs.name(id))
    var title = computed(names, names => names.map(n => '@' + n).join('\n'))

    return h('a.likes', { title }, body)
  }
}

