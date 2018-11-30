const { h, computed, map } = require('mutant')
const nest = require('depnest')
const Scuttle = require('scuttle-thread')
const { isLink } = require('ssb-ref')

exports.gives = nest('message.html.like')

exports.needs = nest({
  'about.obs.name': 'first',
  'keys.sync.id': 'first',
  'message.obs.likes': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  return nest('message.html.like', like)

  function like (msg) {
    const id = api.keys.sync.id()

    // TODO make this full-async :
    //   - get whether i like this currently
    //   - only update after I click like/ unlike

    if (!isLink(msg.key)) return

    const likes = api.message.obs.likes(msg.key)
    const names = map(likes, id => api.about.obs.name(id))
    // TODO should really just calculate this on hover ...

    return computed([likes, names], (likes, names) => {
      const iLike = likes.includes(id)

      return h('MessageLike',
        {
          className: iLike ? '-liked' : '',
          title: names.join('\n'),
          'ev-click': () => publishLike(msg, !iLike)
        },
        [
          h('span.count', likes.length ? likes.length : ''),
          h('i.fa', { className: iLike ? 'fa-heart' : 'fa-heart-o' })
        ]
      )
    })
  }

  function publishLike (msg, value = true) {
    const scuttle = Scuttle(api.sbot.obs.connection)

    scuttle.like(msg, { value }, console.log)
  }
}
