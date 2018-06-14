const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.scroller')

exports.create = function (api) {
  return nest('app.html.scroller', Scroller)

  function Scroller (opts = {}) {
    const { prepend = [], content = null, append = [], classList = [], className = '', title = '' } = opts

    const contentSection = h('section.content', content)

    const container = h('Scroller',
      { classList, className, title, style: { 'overflow-y': 'scroll', 'overflow-x': 'auto' } },
      [
        h('section.top', prepend),
        contentSection,
        h('section.bottom', append)
      ]
    )

    container.scroll = keyscroll(content || contentSection)

    return {
      content: content || contentSection,
      container
    }
  }
}

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
