const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('main.html.scroller')

exports.create = function (api) {
  return nest('main.html.scroller', Scroller)

  function Scroller ({ prepend = [], append = [] } = {}) {
    const content = h('section.content')

    const container = h('Scroller', { style: { overflow: 'auto' } }, [
      h('div.wrapper', [
        h('header', prepend),
        content,
        h('footer', append)
      ])
    ])

    container.scroll = keyscroll(content)

    return {
      content,
      container
    }
  }
}

function keyscroll (container) {
  var curMsgEl

  if (!container) return () => {}

  container.addEventListener('click', onActivateChild, false)
  container.addEventListener('focus', onActivateChild, true)

  function onActivateChild (ev) {
    for (var el = ev.target; el; el = el.parentNode) {
      if (el.parentNode === container) {
        curMsgEl = el
        return
      }
    }
  }

  function selectChild (el) {
    if (!el) return
    (el.scrollIntoViewIfNeeded || el.scrollIntoView).call(el)
    el.focus()
    curMsgEl = el
  }

  return function scroll (d) {
    selectChild((!curMsgEl || d === 'first') ? container.firstChild
      : d < 0 ? curMsgEl.previousElementSibling || container.firstChild
      : d > 0 ? curMsgEl.nextElementSibling || container.lastChild
      : curMsgEl)

    return curMsgEl
  }
}
