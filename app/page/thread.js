const { h, Struct, Value, when, computed, map, resolve, onceTrue } = require('mutant')
const nest = require('depnest')
const get = require('lodash/get')
const { isFeed } = require('ssb-ref')

exports.gives = nest('app.page.thread')

exports.needs = nest({
  'about.html.avatar': 'first',
  'app.html.scroller': 'first',
  'app.html.tabs': 'first',
  'app.sync.locationId': 'first',
  'contact.obs.following': 'first',
  'feed.obs.thread': 'first',
  'keys.sync.id': 'first',
  'message.html.compose': 'first',
  'message.html.render': 'first',
  'message.async.name': 'first',
  'message.sync.unbox': 'first',
  'sbot.async.get': 'first',
  'sbot.pull.links': 'first'
})

exports.create = function (api) {
  return nest('app.page.thread', threadPage)

  function threadPage (location) {
    const root = get(location, 'value.content.root', location.key)
    const msg = location.key
    if (msg !== root) scrollDownToMessage(msg)

    const myId = api.keys.sync.id()
    const ImFollowing = api.contact.obs.following(myId)
    const { messages, isPrivate, rootId, lastId, channel, recps } = api.feed.obs.thread(root)
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
      location,
      feedIdsInThread: computed(messages, msgs => msgs.map(m => m.value.author)),
      placeholder: 'Write a reply',
      shrink: false
    })
    const content = h('section.content', map(messages, m => {
      return api.message.html.render(resolve(m), {pageId: root})
    }))
    const { container } = api.app.html.scroller({ prepend: header, content, append: composer })

    container.classList.add('Thread')
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

    function scrollDownToMessage (id) {
      const locationId = api.app.sync.locationId(location)
      const tabs = api.app.html.tabs()
      locateKey()

      function locateKey () {
        // wait till we're on the right page
        if (tabs.currentPage().id !== locationId) return setTimeout(locateKey, 200)

        if (!tabs.currentPage().scroll) return setTimeout(locateKey, 200)

        tabs.currentPage().scroll('first')
        const msg = tabs.currentPage().querySelector(`[data-id='${id}']`)
        if (!msg) return setTimeout(locateKey, 200)

        ;(msg.scrollIntoViewIfNeeded || msg.scrollIntoView).call(msg)
        msg.focus()
      }
    }
  }
}
