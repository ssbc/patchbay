const nest = require('depnest')
const { h, Value, resolve } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('mutant-scroll')
var HLRU = require('hashlru')

const next = require('pull-next-step')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.feed': true
})

exports.needs = nest({
  'app.html.filter': 'first',
  'app.html.scroller': 'first',
  'app.sync.goTo': 'first',
  'feed.pull.public': 'first',
  'message.html.compose': 'first',
  'message.html.render': 'first',
  'message.sync.root': 'first',
  'sbot.async.get': 'first',
})

exports.create = function (api) {
  // cache mostly just to avoid reading the same roots over and over again
  // not really big enough for multiple refresh cycles
  var cache = HLRU(100)

  return nest({
    'app.html.menuItem': menuItem,
    'app.page.feed': feedPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'feed' })
    }, '/feed')
  }

  function feedPage (location) {
    const composer = api.message.html.compose({
      location,
      meta: { type: 'post' },
      placeholder: 'Write a public message'
    })

    const filter = () => pull(
      // filter private messages
      pull.filter(msg => msg.value && msg.value.content),
      pull.filter(msg => msg.value.content.type === 'post')
    )

    const render = (msgObs) => {
      // if (msg.value.content.type === 'about') debugger
      const msg = resolve(msgObs) // actually the rollup
      return api.message.html.render(msg)
    }

    var scroller = Scroller({
      classList: [ 'Page', '-feed' ],
      prepend: composer,
      streamToTop: pull(
        next(api.feed.pull.public, {old: false, limit: 100, property: ['value', 'timestamp']}),
        filter(),
        miniRollup()
      ),
      streamToBottom: pull(
        next(api.feed.pull.public, {reverse: true, limit: 100, live: false, property: ['value', 'timestamp']}),
        filter(),
        // TODO should probably filter out older messages from existing rollups
        // before we waste energy building a rollup
        miniRollup()
      ),
      // store: recentMsgCache,
      updateTop: updateRecentMsgCache,
      updateBottom: updateRecentMsgCache,
      render
    })

    function miniRollup () {
      return pull(
        pull.asyncMap((msg, cb) => {
          // if (msg.value) {
          var root = api.message.sync.root(msg)
          if (!root) {
            cb(null, Object.assign(msg, { replies: [] }))
          } else {
            if (cache.has(root)) {
              var miniRollup = cache.get(root)
              miniRollup.replies.push(msg)
              miniRollup.replies.sort((a, b) => a.value.timestamp > b.value.timestamp)
              // unlike thread this stores the replies old > new (NEWEST LAST

              cache.set(root, miniRollup)
              cb(null, miniRollup)
            } else {
              api.sbot.async.get(root, (_, value) => {
                var miniRollup = { key: root, value, replies: [msg] }
                if (miniRollup.value) cache.set(root, miniRollup)
                cb(null, miniRollup)
              })
            }
          }
        })
      )
    }

    function updateRecentMsgCache (soFar, newRollup) {
      // PROBLEM - newRollup is arriving without the most recent reply D:
      soFar.transaction(() => { 
        const { timestamp } = lastReply(newRollup).value

        const index = indexOf(soFar, (rollup) => newRollup.key === resolve(rollup).key)
        var object = Value()

        if (index >= 0) {
          // reference already exists, lets use this instead!
          const existingRollup = soFar.get(index)

          if (lastReply(existingRollup).value.timestamp > timestamp) return 
          // but abort if the existing reference is newer

          object = existingRollup
          soFar.deleteAt(index)
        }

        object.set(newRollup)

        const justOlderPosition = indexOf(soFar, (rollup) => timestamp > lastReply(rollup).value.timestamp)
        if (justOlderPosition > -1) {
          soFar.insert(object, justOlderPosition)
        } else {
          soFar.push(object)
        }
      })
    }

    scroller.title = '/feed'
    return scroller
  }
}

function indexOf (array, fn) {
  for (var i = 0; i < array.getLength(); i++) {
    if (fn(array.get(i))) {
      return i
    }
  }
  return -1
}

function lastReply (rollupObs) {
  // latest reply is stored LAST
  const rollup = resolve(rollupObs)

  if (!rollup.replies) debugger
  if (!rollup.replies.length) return rollup

  return rollup.replies[rollup.replies.length-1]
}


