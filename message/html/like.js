const { h, computed } = require('mutant')
const nest = require('depnest')
const Scuttle = require('scuttle-thread')
const { isLink } = require('ssb-ref')

exports.needs = nest({
  'keys.sync.id': 'first',
  'message.obs.likes': 'first',
  'sbot.obs.connection': 'first'
})

exports.gives = nest('message.html.like')

exports.create = (api) => {
  return nest('message.html.like', like)

  function like (msg) {
    const id = api.keys.sync.id()

    // TODO make this full-async :
    //   - get whether i like this currently
    //   - only update after I click like/ unlike

    if (!isLink(msg.key)) return

    return computed(api.message.obs.likes(msg.key), likes => {
      const iLike = likes.includes(id)

      return h('MessageLike',
        {
          className: iLike ? '-liked' : '',
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
