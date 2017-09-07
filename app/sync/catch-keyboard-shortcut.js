const nest = require('depnest')

exports.gives = nest('app.sync.catchKeyboardShortcut')

exports.needs = nest({
  'app.html.searchBar': 'first',
  'app.html.tabs': 'first',
  'app.sync.goTo': 'first',
})

var gPressed = false

exports.create = function (api) {
  return nest('app.sync.catchKeyboardShortcut', catchKeyboardShortcut)

  function catchKeyboardShortcut (root) {
    var tabs = api.app.html.tabs()
    var search = api.app.html.searchBar()
    var goTo = api.app.sync.goTo

    root.addEventListener('keydown', (ev) => {
      isTextFieldEvent(ev)
        ? textFieldShortcuts(ev)
        : genericShortcuts(ev, { tabs, search, goTo })
    })
  }
}

function isTextFieldEvent (ev) {
  const tag = ev.target.nodeName
  return (tag === 'INPUT' || tag === 'TEXTAREA')
}

function textFieldShortcuts (ev) {
  if (ev.keyCode === 13 && ev.ctrlKey) {
    ev.target.publish()  // expects the textField to have a publish method
  }
}

function genericShortcuts (ev, { tabs, goTo, search }) {
  // Messages
  if (ev.keyCode === 71) { // gg = scroll to top
    if (!gPressed) {
      gPressed = true
      window.setTimeout(() => {
        gPressed = false
      }, 3000)
      return
    }
    tabs.getCurrent().firstChild.scroll('first')
  }
  gPressed = false

  switch (ev.keyCode) {
    // Messages (cont'd)
    case 74: // j = older
      return tabs.getCurrent().firstChild.scroll(1)
    case 75: // k = newer
      return tabs.getCurrent().firstChild.scroll(-1)
    case 13: // enter = open
      return goToMessage(ev, { tabs, goTo })
    case 79: // o = open
      return goToMessage(ev, { tabs, goTo })
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
      // TODO add history call in here
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
  }
}

function goToMessage (ev, { tabs, goTo }) {
  const msg = ev.target
  if (!msg.classList.contains('Message')) return

  const { root, id } = msg.dataset
  if (!root) return goTo(id)

  goTo(root)
  setTimeout(() => scrollDownToMessage(id, tabs), 250)
}

function scrollDownToMessage (id, tabs) {
  tabs.getCurrent().firstChild.scroll('first')
  locateKey()

  function locateKey () {
    const msg = tabs.getCurrent().querySelector(`[data-id='${id}']`)
    if (msg === null) return setTimeout(locateKey, 100)

    ;(msg.scrollIntoViewIfNeeded || msg.scrollIntoView).call(msg)
    msg.focus()
  }
}

function toggleRawMessage (ev) {
  const msg = ev.target
  if (!msg.classList.contains('Message')) return

  // this uses a crudely exported nav api
  msg.querySelector('.meta .toggle-raw-msg').click()
}
