const { h, computed, map, Value } = require('mutant')
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
    const iLikeHack = Value()
    const names = map(likes, id => api.about.obs.name(id))
    // TODO should really just calculate this on hover ...

    return computed([likes, iLikeHack, names], (likes, iLikeHack, names) => {
      const iLike = (iLikeHack !== null) ? iLikeHack : likes.includes(id)
      var count = likes.length
      if (iLikeHack === true && !likes.includes(id)) count++
      else if (iLikeHack === false && likes.includes(id)) count--

      return h('MessageLike',
        {
          className: iLike ? '-liked' : '',
          title: names.join('\n'),
          'ev-click': () => publishLike(msg, !iLike)
        },
        [
          h('span.count', count || ''),
          h('i.fa', { className: iLike ? 'fa-heart' : 'fa-heart-o' })
        ]
      )
    })

    function publishLike (msg, value = true) {
      const _val = iLikeHack()
      iLikeHack.set(value)
      const scuttle = Scuttle(api.sbot.obs.connection)

      scuttle.like(msg, { value }, (err, data) => {
        if (err) {
          iLikeHack.set(_val)
          console.error(err)
          return
        }

        console.log(data)
      })
    }
  }
}
