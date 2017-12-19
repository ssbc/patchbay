const nest = require('depnest')
const { h, resolve, computed } = require('mutant')

exports.gives = nest({
  'feed.html.feedCard': true
})

exports.needs = nest({
  'message.html.render': 'first',
  'message.html.timestamp': 'first',
  'about.obs.name': 'first',
})


exports.create = function (api) {
  return nest({
    'feed.html.feedCard': feedCard,
  })

  function feedCard (msgObs) {
    const msg = resolve(msgObs) // actually the rollup

    const opts = {
      attributes: {
        tabindex: '0', // needed to be able to show focus on keyscroll
        'data-id': msg.key,
        'data-root': msg.value.content.root || msg.key
      },
    }
    return h('FeedCard', opts, [
      api.message.html.render(msg),
      computed(msgObs, msg => h('div', msg.replies.slice(-3).map(Reply)) )
    ])
  }

  function Reply (msg) {
    const { author, content } = msg.value
    return h('div', [
      h('b', api.about.obs.name(author)),
      ' - ',
      // api.message.html.timestamp(msg),
      content.text.substr(0,124)
    ])
  }
}

