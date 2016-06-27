module.exports = function (container) {
  var curMsgEl

  if (!container)
    return function() {}

  container.addEventListener('click', onActivateChild, false)
  container.addEventListener('focus', onActivateChild, true)

  function onActivateChild(ev) {
    for (var el = ev.target; el; el = el.parentNode) {
      if (el.parentNode == container) {
        curMsgEl = el
        return
      }
    }
  }

  function selectChild(el) {
    if (!el) return
    el.scrollIntoViewIfNeeded()
    el.focus()
    curMsgEl = el
  }

  return function scroll(d) {
    selectChild(!curMsgEl ? container.firstChild
      : d > 0 ? curMsgEl.nextElementSibling || container.lastChild
      : d < 0 ? curMsgEl.previousElementSibling || container.firstChild
      : curMsgEl)
  }
}
