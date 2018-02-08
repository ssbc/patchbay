const nest = require('depnest')

exports.gives = nest('app.sync.catchKeyboardShortcut')

exports.needs = nest({
  'app.html.searchBar': 'first',
  'app.html.tabs': 'first',
  'app.sync.goTo': 'first'
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
  switch (ev.keyCode) {
    case 13: // ctrl+enter
      if (ev.ctrlKey) {
        ev.target.publish()  // expects the textField to have a publish method
      }
      return
    case 27: // esc
      return ev.target.blur()
  }
}

function genericShortcuts (ev, { tabs, search, goTo }) {
  // Messages
  if (ev.keyCode === 71) { // gg = scroll to top
    if (!gPressed) {
      gPressed = true
      window.setTimeout(() => {
        gPressed = false
      }, 3000)
      return
    }
    tabs.currentPage().scroll('first')
  }
  gPressed = false

  switch (ev.keyCode) {
    // Messages (cont'd)
    case 74: // j = older
      return tabs.currentPage().scroll(1)
    case 75: // k = newer
      return tabs.currentPage().scroll(-1)
    case 13: // enter = open
      return goToMessage(ev, { goTo })
    case 79: // o = open
      return goToMessage(ev, { goTo })
    case 192: // ` = toggle raw message view
      return toggleRawMessage(ev)

    // Tabs
    case 72: // h = left
      tabs.selectRelative(-1)
      return goTo(JSON.parse(tabs.currentPage().id))
    case 76: // l = right
      tabs.selectRelative(1)
      return goTo(JSON.parse(tabs.currentPage().id))
    case 88: // x = close
      if (tabs.selected) {
        var sel = tabs.selected
        tabs.remove(sel)
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
  }
}

function goToMessage (ev, { goTo }) {
  const msg = ev.target
  if (!msg.classList.contains('Message')) return

  goTo(msg.dataset.id)
  // TODO - rm the dataset.root decorator
}


function toggleRawMessage (ev) {
  const msg = ev.target
  if (!msg.classList.contains('Message')) return

  // this uses a crudely exported nav api
  msg.querySelector('.meta .toggle-raw-msg').click()
}
