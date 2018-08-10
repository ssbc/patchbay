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
  'keys.sync.id': 'first',
  'message.html.compose': 'first',
  'message.html.markdown': 'first',
  'message.html.timestamp': 'first',
  'message.obs.backlinks': 'first',
  'sbot.async.get': 'first',
  'sbot.pull.stream': 'first'
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
    const BY_UPDATE = 'Update'
    const BY_START = 'Start'

    const state = Struct({
      sort: Value(BY_UPDATE),
      show: Struct({
        feedId: Value(api.keys.sync.id()),
        started: Value(true),
        participated: Value(true),
        other: Value(true)
      })
    })
    // const feedRoots = getFeedRoots(state.show.feedId)

    const viewSettings = h('section.viewSettings', [
      h('div.show', [
        h('span', 'Show threads:'),
        h('div.toggle',
          { className: when(state.show.started, '-active'), 'ev-click': () => state.show.started.set(!state.show.started()) },
          [ h('i.fa.fa-eye'), 'started' ]
        ),
        h('div.toggle',
          { className: when(state.show.participated, '-active'), 'ev-click': () => state.show.participated.set(!state.show.participated()) },
          [ h('i.fa.fa-eye'), 'participated' ]
        ),
        h('div.toggle',
          { className: when(state.show.other, '-active'), 'ev-click': () => state.show.other.set(!state.show.other()) },
          [ h('i.fa.fa-eye', {}), 'other' ]
        )
      ]),
      h('div.sort', [
        h('span', 'Sort by:'),
        h('button', {
          className: computed(state.sort, s => s === BY_UPDATE ? '-primary' : ''),
          'ev-click': () => state.sort.set(BY_UPDATE)
        }, BY_UPDATE),
        h('button', {
          className: computed(state.sort, s => s === BY_START ? '-primary' : ''),
          'ev-click': () => state.sort.set(BY_START)
        }, BY_START)
      ])
    ])

    return computed(state, state => {
      var page
      if (state.sort === BY_UPDATE) page = PageByUpdate(state)
      if (state.sort === BY_START) page = PageByStart(state)

      page.title = '/posts'
      page.id = '{"page": "posts"}' // this is needed because our page is a computed
      page.scroll = keyscroll(page.querySelector('section.content'))
      return page
    })

    function PageByUpdate (state) {
      const createStream = (opts) => {
        const { feedId, started, participated, other } = state.show
        if (!started && !participated && !other) return pull.empty()

        return api.sbot.pull.stream(server => {
          const $filter = {
            timestamp: { $gt: 0 },
            value: {
              content: {
                type: 'post',
                recps: { $not: true }
              }
            }
          }
          const defaults = { limit: 100, query: [{ $filter }] }
          return next(server.query.read, merge({}, defaults, opts), ['timestamp'])
        })
      }

      return Scroller({
        classList: ['Posts'],
        prepend: [
          viewSettings,
          Composer(location)
        ],
        streamToTop: createStream({ live: true, old: false }),
        streamToBottom: createStream({ reverse: true }),
        updateTop: (soFar, msg) => {
          const root = getRoot(msg)
          if (soFar.includes(root)) soFar.delete(root)
          soFar.insert(root)
        },
        updateBottom: (soFar, msg) => {
          const root = getRoot(msg)
          if (!soFar.includes(root)) soFar.push(root)
        },
        render: key => render(state, key)
      })
    }

    function PageByStart (state) {
      const createStream = (opts) => {
        const { feedId, started, participated, other } = state.show
        if (!started && !participated && !other) return pull.empty()

        return api.sbot.pull.stream(server => {
          const defaults = {
            limit: 200,
            query: [{
              $filter: {
                value: {
                  timestamp: { $gt: 0 },
                  content: {
                    type: 'post',
                    root: { $not: true }, // is a root (as doesn't name a root)
                    recps: { $not: true } // is public
                  }
                }
              }
            }, {
              $map: {
                key: 'key', // this means this stream behvaues same as PageByUpdate (only keys in store)
                value: {
                  timestamp: ['value', 'timestamp']
                }
              }
            }]
          }
          if (started && !participated && !other) {
            defaults.query[0].$filter.value.author = feedId
          }

          // server.query.explain(merge({}, defaults, opts), console.log)
          return pull(
            next(server.query.read, merge({}, defaults, opts), ['value', 'timestamp']),
            pull.map(m => m.key)
          )
        })
      }

      return Scroller({
        classList: ['Posts'],
        prepend: [
          viewSettings,
          Composer(location)
        ],
        streamToTop: createStream({ live: true, old: false }),
        streamToBottom: createStream({ reverse: true }),
        render: key => render(state, key)
      })
    }
  }

  function Composer (location) {
    return api.message.html.compose({
      location,
      meta: { type: 'post' },
      placeholder: 'Write a public message'
    })
  }

  // TODO - extract somewhere?
  function render (state, key) {
    const root = buildRoot(key)
    const { recent, repliesCount, likesCount, backlinksCount, participants } = buildThread(key)

    const { feedId, started, participated, other } = state.show
    // throttling?
    const isVisible = computed([root.author, participants], (a, p) => {
      return Boolean(
        (started ? (a === feedId) : null) ||
        (participated ? (p.includes(feedId)) : null) ||
        (other ? (!p.includes(feedId)) : null)
      )
    })
    // NOTE - this filtering could be done more efficiently upstream with some targeted
    // or merged queries. The 'other' case is probably hard to do tidily

    const onClick = ev => {
      ev.preventDefault()
      ev.stopPropagation()
      api.app.sync.goTo(key)
    }

    return when(root.sync,
      when(isVisible,
        h('ThreadCard',
          {
            // className: computed(root.md, r => r ? '' : '-loading'),
            attributes: {
              tabindex: '0', // needed to be able to navigate and show focus()
              'data-id': key // TODO do this with decorators?
            }
          }, [
            h('section.authored', [
              h('div.avatar', root.avatar),
              h('div.name', root.authorName),
              h('div.timestamp', root.timestamp)
            ]),
            h('section.content-preview', { 'ev-click': onClick }, [
              h('div.root', root.md),
              h('div.recent', map(recent, msg => {
                return h('div.msg', [
                  h('span.author', api.about.obs.name(msg.value.author)),
                  ': ',
                  h('span.preview', [
                    api.message.html.markdown(msg.value.content).innerText.slice(0, 120),
                    '...'
                  ])
                ])
              }))
            ]),
            h('section.stats', [
              h('div.participants', map(participants, api.about.html.avatar)),
              h('div.counts', [
                h('div.comments', [ repliesCount, h('i.fa.fa-comment-o') ]),
                h('div.likes', [ likesCount, h('i.fa.fa-heart-o') ]),
                h('div.backlinks', [ backlinksCount, h('i.fa.fa-link') ])
              ])
            ])
          ]
        )
        // h('div', 'non-match')
      ),
      h('ThreadCard -loading')
    )
  }

  function buildRoot (key) {
    const root = Struct({
      author: '',
      authorName: '',
      avatar: '',
      timestamp: '',
      md: ''
    })
    root.sync = Value(false)

    api.sbot.async.get(key, (err, value) => {
      if (err) return console.error('ThreadCard could not fetch ', key)
      root.author.set(value.author)
      root.authorName.set(api.about.html.link(value.author))
      root.avatar.set(api.about.html.avatar(value.author))
      root.timestamp.set(api.message.html.timestamp({ key, value }))
      root.md.set(api.message.html.markdown(value.content))

      root.sync.set(true)
    })

    return root
  }

  function buildThread (key) {
    const recent = MutantArray([])
    const repliesCount = Value()
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

    return { recent, repliesCount, likesCount, backlinksCount, participants }
  }

  // function getFeedRoots (feedId) {
  //   const obs = computed(feedId, feedId => {
  //     const keys = MutantArray([])
  //     const source = opts => api.sbot.pull.stream(s => s.query.read(opts))
  //     const opts = {
  //       query: [{
  //         $filter: {
  //           value: {
  //             author: feedId,
  //             content: {
  //               root: { $not: true },
  //               recps: { $not: true }
  //             }
  //           }
  //         }
  //       }, {
  //         $map: 'key'
  //       }],
  //       live: true
  //     }

  //     pull(
  //         source(opts),
  //         pull.drain(k => {
  //           if (k.sync) obs.sync.set(true)
  //           else keys.push(k)
  //         })
  //       )

  //     return keys
  //   })

  //   obs.sync = Value(false)
  //   return obs
  // }
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
