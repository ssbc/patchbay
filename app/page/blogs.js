const nest = require('depnest')
const { h } = require('mutant')
// const pull = require('pull-stream')
const Scroller = require('mutant-scroll')
const next = require('pull-next-query')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.blogs': true
})

exports.needs = nest({
  'app.sync.goTo': 'first',
  'message.html.render': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.blogs': blogsPage
  })

  function menuItem () {
    return h('a', {
      style: { order: 1 },
      'ev-click': () => api.app.sync.goTo({ page: 'blogs' })
    }, '/blogs')
  }

  function blogsPage (location) {
    const createStream = (opts) => {
      const query = [{
        $filter: {
          timestamp: { $gt: 0 },
          value: {
            content: { type: 'blog' }
          }
        }
      }]
      return api.sbot.pull.stream(server => {
        return next(server.query.read, Object.assign({}, { limit: 100, query }, opts), ['timestamp'])
      })
    }
    var page = Scroller({
      classList: ['Blogs'],
      streamToTop: createStream({ live: true, old: false }),
      streamToBottom: createStream({ reverse: true }),
      render: api.message.html.render
    })

    page.title = '/blogs'
    page.scroll = keyscroll(page.querySelector('section.content'))
    return page
  }
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
