const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.scroller')

exports.create = function (api) {
  return nest('app.html.scroller', Scroller)

  function Scroller (opts = {}) {
    const { prepend, content = null, append, classList = [], className = '', title = '', scrollIntoView } = opts

    const contentSection = h('section.content', {
      title: '',
      intersectionBindingViewport: { rootMargin: '1000px' } // mutant magic
    }, content)

    const container = h('Scroller',
      {
        classList,
        className,
        title,
        style: { 'overflow-y': 'scroll', 'overflow-x': 'auto' },
        // TODO (watch for breaks e.g. stuff stops updating after scrolling)
      },
      [
        prepend ? h('section.top', prepend) : null,
        contentSection,
        append ? h('section.bottom', append) : null
      ]
    )

    container.keyboardScroll = KeyboardScroll(contentSection, scrollIntoView)

    return {
      content: contentSection,
      container
    }
  }
}

function KeyboardScroll (content, scrollIntoView = false) {
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
    const child = (!curMsgEl || d === 'first') ? content.firstChild
      : (!curMsgEl || d === 'last') ? content.lastChild
        : d < 0 ? curMsgEl.previousElementSibling || content.firstChild
          : d > 0 ? curMsgEl.nextElementSibling || content.lastChild
            : curMsgEl

    selectChild(child)
    curMsgEl = child

    return curMsgEl
  }

  function selectChild (el) {
    if (!el) { return }

    if (scrollIntoView) {
      if (!el.scrollIntoViewIfNeeded && !el.scrollIntoView) return
      ;(el.scrollIntoViewIfNeeded || el.scrollIntoView).call(el)
    } else {
      const height = el.offsetTop - content.parentElement.offsetTop - 10
      // content.parentElement.scroll({ top: height, behavior: 'smooth' })
      content.parentElement.scrollTop = height
    }

    if (el.focus) el.focus()
  }
}
