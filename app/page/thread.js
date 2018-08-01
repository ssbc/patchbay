const { h, Struct, Value, when, computed, map, resolve, onceTrue, watch } = require('mutant')
const nest = require('depnest')
const get = require('lodash/get')
const throttle = require('lodash/throttle')
const { isFeed } = require('ssb-ref')
const OnScreen = require('onscreen')

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
    onceTrue(channel, ch => {
      const channelInput = composer.querySelector('input')
      channelInput.value = `#${ch}`
      channelInput.disabled = true
    })

    const content = map(messages, m => {
      return api.message.html.render(resolve(m), {pageId: root})
    })

    const { container } = api.app.html.scroller({ prepend: header, content, append: composer })
    container.classList.add('Thread')
    container.title = msg
    api.message.async.name(root, (err, name) => {
      if (err) throw err
      container.title = name
    })

    /////////////////////////////////////////////////
    //v2
    //
    // const os = new OnScreen({ container: container })

    // var attached = false
    // watch(messages, msgs => {
    //   console.log('boop')
    //   if (attached) os.off('leave', '.Thread .Message[data-id]')
    //   os.on('leave', '.Message[data-id]', (el, ev) => {
    //     console.log(el)
    //   })
    //   attached = true
    // })

    //////////////////
    // v1

    // var els = []
    // watch(messages, msgs => {
    //   els = container.querySelectorAll('.Message[data-id]')
    //   console.log('update els', els.length)
    //   // NOTE - this tightly couples knowledge of message rendering + decoration D:
    // })
    // container.addEventListener('scroll', throttle(() => {
    //   console.log('beep')

    //   var height = (window.innerHeight || document.documentElement.clientHeight)
    //   var width = (window.innerWidth || document.documentElement.clientWidth)
    //   var inViewport
    //   var rect

    //   els.forEach(el => {
    //     console.log(el, el.getBoundingClientRect())
    //     // rect = el.getBoundingClientRect()

    //     // inViewport = (
    //     //   (
    //     //     rect.top >= 0 ||
    //     //     rect.bottom <= height ||
    //     //     (rect.top < 0 && rect.bottom > height) // covers whole viewPort
    //     //   ) && (
    //     //     rect.left >= 0 ||
    //     //     rect.right <= width ||
    //     //     (rect.left < 0 && rect.right > width)
    //     //   )
    //     // )

    //     // if (inViewport) console.log(el)
    //   })
    // }, 300))

    container.scrollDownToMessage = scrollDownToMessage
    container.addQuote = addQuote
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

    function addQuote (value) {
      composer.addQuote(value)
    }
  }
}

function inViewport (el) {
  var height = (window.innerHeight || document.documentElement.clientHeight)
  var width = (window.innerWidth || document.documentElement.clientWidth)
  var { top, left, bottom, right } = el.getBoundingClientRect()

  return (
    top >= 0 &&
    left >= 0 &&
    bottom <= height &&
    right <= width
  )
}
