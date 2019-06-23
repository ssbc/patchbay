const { h, Struct, computed, map, resolve, onceTrue } = require('mutant')
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
  'sbot.async.run': 'first'
})

exports.create = function (api) {
  return nest('app.page.thread', threadPage)

  function threadPage (location) {
    let root = get(location, 'value.content.root') || get(location, 'value.content.about') || location.key
    if (location.value && location.value.unbox) {
      // direct link with unbox key
      root = location.key
    }
    const msg = location.key
    if (msg !== root) scrollDownToMessage(msg)

    const { messages, isPrivate, rootId, lastId, channel, recps } = api.feed.obs.thread(root)
    const composer = api.message.html.compose({
      meta: Struct({
        type: 'post',
        root: rootId,
        branch: lastId,
        channel,
        recps
      }),
      location,
      feedIdsInThread: computed(messages, msgs => msgs.map(m => m.value.author)),
      placeholder: 'Write a reply',
      shrink: false
    })

    onceTrue(channel, ch => {
      const channelInput = composer.querySelector('input')
      channelInput.value = `#${ch}`
      channelInput.disabled = true
    })

    const content = map(messages, m => {
      let msg = resolve(m)
      if (msg.key === location.key && location.value && location.value.unbox) {
        // we have an unbox key, so message is already unboxed
        msg = location
      }
      const message = api.message.html.render(msg, { pageId: root })
      markReadWhenVisible(message)
      return message
    }, { comparer })

    const { container } = api.app.html.scroller({ prepend: Header({ isPrivate, recps }), content, append: composer })
    container.classList.add('Thread')
    container.title = root
    api.message.async.name(root, (err, name) => {
      if (err) throw err
      container.title = name

      // TODO tidy this up
      // over-ride message.async.name OR create message.async.subject
      onceTrue(messages, msgs => {
        const subject = get(msgs, ' [0].value.content.subject')
        if (!subject) return
        container.title = subject
      })
    })

    container.scrollDownToMessage = scrollDownToMessage
    container.addQuote = composer.addQuote
    return container

    function scrollDownToMessage (id) {
      const locationId = api.app.sync.locationId(location)
      const tabs = api.app.html.tabs()
      locateKey()

      function locateKey () {
        // wait till we're on the right page
        if (tabs.currentPage().id !== locationId) return setTimeout(locateKey, 200)

        if (!tabs.currentPage().keyboardScroll) return setTimeout(locateKey, 200)

        tabs.currentPage().keyboardScroll('first')
        const msg = tabs.currentPage().querySelector(`[data-id='${id}']`)
        if (!msg) return setTimeout(locateKey, 200)

        ;(msg.scrollIntoViewIfNeeded || msg.scrollIntoView).call(msg)
        msg.focus()
      }
    }
  }

  // only for private threads
  function Header ({ isPrivate, recps }) {
    return computed(isPrivate, isPrivate => {
      if (!isPrivate) return

      const myId = api.keys.sync.id()
      const ImFollowing = api.contact.obs.following(myId)

      return computed([recps, ImFollowing], (recps, ImFollowing) => {
        recps = recps.map(r => isFeed(r) ? r : r.link)

        const strangers = recps
          .filter(r => !Array.from(ImFollowing).includes(r))
          .filter(r => r !== myId)

        return [
          h('section.recipients', recps.map(r => {
            const className = strangers.includes(r) ? 'warning' : ''
            return h('div', { className }, api.about.html.avatar(r))
          })),
          strangers.length
            ? h('section.info -warning', 'There is a person in this thread you do not follow (bordered in red). If you think you know this person it might be worth checking their profile to confirm they are who they say they are.')
            : h('section.info', 'These are the other participants in this thread. Once a private thread is started you cannot add people to it.')
        ]
      })
    })
  }

  // UnreadFeature (search codebase for this if extracting)
  //
  // TODO
  // - extract this into a global depject module?
  // - garbage collect observation?

  var observer
  function markReadWhenVisible (el) {
    if (!observer) {
      observer = new IntersectionObserver((entries, observer) => { // eslint-disable-line
        entries
          .filter(e => e.isIntersecting && e.target.dataset && e.target.dataset.key)
          .forEach(e => {
            markRead(e.target.dataset.key, e.target)
          })
      }, { threshold: 0.35 })
    }

    observer.observe(el)
  }

  function markRead (key, el) {
    api.sbot.async.run(server => server.unread.markRead(key, (err, data) => {
      if (err) console.error(err)

      if (el) setTimeout(() => el.classList.add('-read'), 2000)
    }))
  }
}

function comparer (a, b) {
  return get(resolve(a), 'key') === get(resolve(b), 'key')
}
