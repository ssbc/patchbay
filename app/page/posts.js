const nest = require('depnest')
const { h, Value, Array: MutantArray, Struct, computed, when, map } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('mutant-scroll')
const next = require('pull-next-query')
const merge = require('lodash/merge')
const get = require('lodash/get')
const sort = require('ssb-sort')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.posts': true
})

exports.needs = nest({
  'about.obs.name': 'first',
  'about.html.avatar': 'first',
  'about.html.link': 'first',
  'app.sync.goTo': 'first',
  // 'feed.pull.public': 'first',
  'sbot.async.get': 'first',
  'sbot.pull.stream': 'first',
  'message.html.compose': 'first',
  'message.html.markdown': 'first',
  'message.html.timestamp': 'first',
  'message.obs.backlinks': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.posts': postsPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'posts' })
    }, '/posts')
  }

  function postsPage (location) {
    const BY_UPDATE = 'by_update'
    const BY_ROOT = 'by_root'

    const composer = api.message.html.compose({
      location,
      meta: { type: 'post' },
      placeholder: 'Write a public message'
    })

    const store = MutantArray([])

    const page = Scroller({
      classList: ['Posts'],
      prepend: [
        composer
      ],
      streamToTop: createStream({ live: true, old: false }),
      streamToBottom: createStream({ reverse: true }),
      store,
      updateTop: (soFar, msg) => {
        const root = getRoot(msg)
        if (soFar.includes(root)) soFar.delete(root)
        soFar.insert(root)
      },
      updateBottom: (soFar, msg) => {
        const root = getRoot(msg)
        if (!soFar.includes(root)) soFar.push(root)
      },
      render
    })

    function createStream (opts) {
      return api.sbot.pull.stream(server => {
        // by_update - stream by receive time
        const defaults = {
          limit: 50,
          query: [{
            $filter: {
              timestamp: { $gt: 0 },
              value: {
                content: {
                  type: 'post',
                  recps: { $not: true }
                }
              }
            }
          }]
        }
        return next(server.query.read, merge({}, defaults, opts), ['timestamp'])
      })
    }

    page.title = '/posts'
    page.scroll = keyscroll(page.querySelector('section.content'))
    return page
  }

  // TODO - move out into message.html.render ?
  function render (key) {
    const root = Struct({
      avatar: '',
      author: '',
      timestamp: '',
      md: ''
    })
    api.sbot.async.get(key, (err, value) => {
      if (err) console.error('ThreadCard could not fetch ', key)
      root.avatar.set(api.about.html.avatar(value.author))
      root.author.set(api.about.html.link(value.author))
      root.timestamp.set(api.message.html.timestamp({ key, value }))
      root.md.set(api.message.html.markdown(value.content))
    })

    const repliesCount = Value()
    const recent = MutantArray([])
    const likesCount = Value()
    const backlinksCount = Value()
    const participants = MutantArray([])

    const opts = {
      query: [{
        $filter: { dest: key }
      }],
      index: 'DTA' // asserted timestamp
    }
    pull(
      api.sbot.pull.stream(server => server.backlinks.read(opts)),
      pull.collect((err, msgs) => {
        if (err) console.error(err)

        msgs = sort(msgs)

        const replies = msgs
          .filter(isPost)
          .filter(m => getRoot(m) === key)

        repliesCount.set(replies.length)
        recent.set(lastFew(replies))

        const likes = msgs.filter(isLikeOf(key))
        likesCount.set(likes.length)

        const backlinks = msgs
          .filter(isPost)
          .filter(m => getRoot(m) !== key)
        backlinksCount.set(backlinks.length)

        const authors = replies
          .map(m => m.value.author)
        participants.set(Array.from(new Set(authors)))
      })
    )

    const className = computed(root.md, r => r ? '' : '-loading')
    const onClick = ev => {
      ev.preventDefault()
      ev.stopPropagation()
      api.app.sync.goTo(key)
    }

    return h('ThreadCard',
      {
        className,
        attributes: {
          tabindex: '0', // needed to be able to navigate and show focus()
          'data-id': key // TODO do this with decorators?
        }
      }, [
        h('section.context', [
          h('div.avatar', root.avatar),
          h('div.name', root.author),
          h('div.timestamp', root.timestamp),
          h('div.counts', [
            h('div.comments', [ repliesCount, h('i.fa.fa-comment-o') ]),
            h('div.likes', [ likesCount, h('i.fa.fa-heart-o') ]),
            h('div.backlinks', [ backlinksCount, h('i.fa.fa-link') ])
          ]),
          h('div.participants', map(participants, api.about.html.avatar))
        ]),
        h('section.content-preview', { 'ev-click': onClick }, [
          h('div.root', root.md),
          h('div.recent', map(recent, msg => {
            return h('div.msg', [
              h('div.author', api.about.obs.name(msg.value.author)),
              ': ',
              h('div.preview', [
                api.message.html.markdown(msg.value.content).innerText.slice(0, 120),
                '...'
              ])
            ])
          }))
        ])
      ])
  }
}

function getRoot (msg) {
  return get(msg, 'value.content.root', msg.key)
}

function isPost (msg) {
  return get(msg, 'value.content.type') === 'post'
}

function isLikeOf (key) {
  return function (msg) {
    return get(msg, 'value.content.type') === 'vote' &&
      get(msg, 'value.content.vote.link') === key
  }
}

function lastFew (arr) {
  return arr.reverse().slice(0, 3).reverse()
}

// copied from app.html.scroller
function keyscroll (content) {
  var curMsgEl

  if (!content) return () => {}

  content.addEventListener('click', onActivateChild, false)
  content.addEventListener('focus', onActivateChild, true)

  function onActivateChild (ev) {
    for (var el = ev.target; el; el = el.parentNode) {
      if (el.parentNode === content) {
        curMsgEl = el
        return
      }
    }
  }

  return function scroll (d) {
    selectChild((!curMsgEl || d === 'first') ? content.firstChild
      : d < 0 ? curMsgEl.previousElementSibling || content.firstChild
      : d > 0 ? curMsgEl.nextElementSibling || content.lastChild
      : curMsgEl)

    return curMsgEl
  }

  function selectChild (el) {
    if (!el) { return }

    if (!el.scrollIntoViewIfNeeded && !el.scrollIntoView) return
    ;(el.scrollIntoViewIfNeeded || el.scrollIntoView).call(el)
    el.focus()
    curMsgEl = el
  }
}

