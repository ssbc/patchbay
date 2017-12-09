module.exports = function keyscroll (container) {
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

  return function scroll (d) {
    selectChild((!curMsgEl || d === 'first') ? container.firstChild
      : d < 0 ? curMsgEl.previousElementSibling || container.firstChild
      : d > 0 ? curMsgEl.nextElementSibling || container.lastChild
      : curMsgEl)

    return curMsgEl
  }

  function selectChild (el) {
    if (!el) { return }

    ;(el.scrollIntoViewIfNeeded || el.scrollIntoView).call(el)
    el.focus()
    curMsgEl = el
  }
}

