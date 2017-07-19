const { h, Struct, Value, when, map, resolve, onceTrue } = require('mutant')
const nest = require('depnest')
const { isMsg, isFeed } = require('ssb-ref')

exports.gives = nest('app.page.thread')

exports.needs = nest({
  'about.html.avatar': 'first',
  'app.html.scroller': 'first',
  'contact.obs.following': 'first',
  'feed.obs.thread': 'first',
  'keys.sync.id': 'first',
  message: {
    html: {
      compose: 'first',
      render: 'first'
    },
    'async.name': 'first',
    'sync.unbox': 'first'
  },
  sbot: {
    'async.get': 'first',
    'pull.links': 'first'
  }
})

exports.create = function (api) {
  return nest('app.page.thread', threadPage)

  function threadPage (location) {
    const { msg } = location
    const myId = api.keys.sync.id()
    const ImFollowing = api.contact.obs.following(myId)
    const { messages, isPrivate, rootId, lastId, channel, recps } = api.feed.obs.thread(msg)
    const meta = Struct({
      type: 'post',
      root: rootId,
      branch: lastId,
      channel,
      recps
    })
    const contactWarning = Value(false)
    const header = when(isPrivate, [
      h('section.recipients', map(recps, r => {
        const id = isFeed(r) ? r : r.link

        var className
        if (contactIsTrouble(id)) {
          className = 'warning'
          contactWarning.set(true)
        }
        return h('div', { className }, api.about.html.avatar(id))
      })),
      when(contactWarning,
        h('section.info -warning', 'There is a person in this thread you do not follow (bordered in red). If you think you know this person it might be worth checking their profile to confirm they are who they say they are.'),
        h('section.info', 'These are the other participants in this thread. Once a private thread is started you cannot add people to it.')
      )
    ])
    function contactIsTrouble (id) {
      if (id === myId) return false
      if (Array.from(ImFollowing()).includes(id)) return false
      return true
    }

    const composer = api.message.html.compose({
      meta,
      placeholder: 'Write a reply',
      shrink: false
    })
    const content = h('section.content', map(messages, m => {
      return api.message.html.render(resolve(m), {pageId: msg})
    }))
    const { container } = api.app.html.scroller({ prepend: header, content, append: composer })

    container.classList.add('Thread')
    container.id = JSON.stringify(location)
    container.title = msg
    api.message.async.name(msg, (err, name) => {
      if (err) throw err
      container.title = name
    })

    onceTrue(channel, ch => {
      const channelInput = composer.querySelector('input')
      channelInput.value = `#${ch}`
      channelInput.disabled = true
    })

    return container
  }
}

