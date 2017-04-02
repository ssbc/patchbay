const nest = require('depnest')

exports.gives = nest('main.sync.catchKeyboardShortcut')

exports.create = function (api) {
  return nest('main.sync.catchKeyboardShortcut', catchKeyboardShortcut)

  function catchKeyboardShortcut (root, opts) {
    var gPressed = false

    root.addEventListener('keydown', (ev) => {
      isTextFieldEvent(ev)
        ? textFieldShortcuts(ev)
        : genericShortcuts(ev, opts)
    })
  }
}

// TODO build better apis for navigation, search, and publishing

function isTextFieldEvent (ev) {
  const tag = ev.target.nodeName
  return (tag === 'INPUT' || tag === 'TEXTAREA')
}

function textFieldShortcuts (ev) {
  if (ev.keyCode === 13 && ev.ctrlKey) {
    ev.target.publish()  // expects the textField to have a publish method
  }
}

function genericShortcuts (ev, { tabs, search }) {
  // Messages
  if (ev.keyCode === 71) { // gg = scroll to top
    if (!gPressed) {
      gPressed = true
      return
    }
    tabs.get(tabs.selected[0]).firstChild.scroll('first')
  }
  gPressed = false

  switch (ev.keyCode) {

    // Messages (cont'd)
    case 74: // j = older
      return tabs.get(tabs.selected[0]).firstChild.scroll(1)
    case 75: // k = newer
      return tabs.get(tabs.selected[0]).firstChild.scroll(-1)
    case 13: // enter = open
      return goToMessage(ev, tabs)
    case 79: // o = open
      return goToMessage(ev, tabs)
    case 192: // ` = toggle raw message view
      return toggleRawMessage(ev)

    // Tabs
    case 72: // h = left
      return tabs.selectRelative(-1)
    case 76: // l = right
      return tabs.selectRelative(1)
    case 88: // x = close
      if (tabs.selected) {
        var sel = tabs.selected
        var i = sel.reduce(function (a, b) { return Math.min(a, b) })
        tabs.remove(sel)
        tabs.select(Math.max(i - 1, 0))
      }
      return

    // Search
    case 191: // / = routes search
      if (ev.shiftKey) search.activate('?', ev)
      else search.activate('/', ev)
      return
    case 50: // @ = mention search
      if (ev.shiftKey) search.activate('@', ev)
      return
    case 51: // # = channel search
      if (ev.shiftKey) search.activate('#', ev)
      return
    case 53: // % = message search
      if (ev.shiftKey) search.activate('%', ev)
      return
  }
}

function goToMessage (ev, tabs) {
  const msg = ev.target
  if (!msg.classList.contains('Message')) return

  // this uses a crudely exported nav api
  const search = document.querySelector('input[type=search]')

  const { root, key } = msg.dataset
  if (!root) return search.go(key)

  search.go(root)
  scrollDownToMessage(key, tabs)
}

function scrollDownToMessage (key, tabs) {
  tabs.get(tabs.selected[0]).firstChild.scroll('first')
  locateKey()

  function locateKey () {
    const msg = tabs.get(tabs.selected[0]).firstChild.scroll(1)
    if (msg === undefined) return setTimeout(locateKey, 100)

    if (msg && msg.dataset && msg.dataset.key === key) return

    locateKey()
  }
}

function toggleRawMessage (ev) {
  const msg = ev.target
  if (!msg.classList.contains('Message')) return

  // this uses a crudely exported nav api
  msg.querySelector('.meta .toggle-raw-msg').click()
}

