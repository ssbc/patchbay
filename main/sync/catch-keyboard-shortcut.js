const nest = require('depnest')

exports.gives = nest('main.sync.catchKeyboardShortcut')

exports.create = function (api) {
  return nest('main.sync.catchKeyboardShortcut', catchKeyboardShortcut)

  function catchKeyboardShortcut (root, tabs, search) {
    var gPressed = false

    root.addEventListener('keydown', (ev) => {
      if (ev.target.nodeName === 'INPUT') return
      if (ev.target.nodeName === 'TEXTAREA') return

      // scroll to top
      if (ev.keyCode === 71) { // g
        if (!gPressed) {
          gPressed = true
          return
        }
        tabs.get(tabs.selected[0]).firstChild.scroll('first')
      }
      gPressed = false

      switch (ev.keyCode) {

        // scroll through messages
        case 74: // j
          return tabs.get(tabs.selected[0]).firstChild.scroll(1)
        case 75: // k
          return tabs.get(tabs.selected[0]).firstChild.scroll(-1)

        // scroll through tabs
        case 72: // h
          return tabs.selectRelative(-1)
        case 76: // l
          return tabs.selectRelative(1)

        // close current tab
        case 88: // x
          if (tabs.selected) {
            var sel = tabs.selected
            var i = sel.reduce(function (a, b) { return Math.min(a, b) })
            tabs.remove(sel)
            tabs.select(Math.max(i - 1, 0))
          }
          return

        // activate the search field
        case 191: // /
          if (ev.shiftKey) search.activate('?', ev)
          else search.activate('/', ev)
          return

        // navigate to a feed
        case 50: // 2
          if (ev.shiftKey) search.activate('@', ev)
          return

        // navigate to a channel
        case 51: // 3
          if (ev.shiftKey) search.activate('#', ev)
          return

        // navigate to a message
        case 53: // 5
          if (ev.shiftKey) search.activate('%', ev)
          return
      }
    })
  }
}

