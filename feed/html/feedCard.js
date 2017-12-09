const nest = require('depnest')
const { h, resolve, computed } = require('mutant')

exports.gives = nest({
  'feed.html.feedCard': true
})

exports.needs = nest({
  'message.html.render': 'first',
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
      'Recent replies:',
      computed(msgObs, msg => {
        return h('ul', msg.replies.map(reply => h('li', [
          reply.value.timestamp,
          ' ',
          reply.key 
        ])))
      })
    ])
  }
}

