var Tabs = require('hypertabs')
var h = require('hyperscript')
var pull = require('pull-stream')
var u = require('../util')
var keyscroll = require('../keyscroll')

function ancestor (el) {
  if(!el) return
  if(el.tagName !== 'A') return ancestor(el.parentElement)
  return el
}

var plugs = require('../plugs')
var screen_view = plugs.first(exports.screen_view = [])

function openExternal (url) {
  var _r = require //fool browserify

  //electron@1
  try {return _r('electron').shell.openExternal(url) }
  catch (err) { }

  //electron@0
  try { return _r('shell').openExternal(url) }
  catch (err) { }

  //browser
  window.open(url, '_blank')
}

exports.message_render = []

exports.app = function () {
  var tabs = Tabs()
  tabs.classList.add('screen')

  var search = h('input.searchprompt', {
    type: 'search',
    style: {'float': 'right'},
    onkeydown: function (ev) {
      switch (ev.keyCode) {
        case 13: // enter
          var path = '?' + search.value
          if(tabs.has(path)) return tabs.select(path)
          var el = screen_view(path)
          if(el) {
            el.scroll = keyscroll(el.querySelector('.scroller__content'))
            tabs.add('?' + search.value, el, !ev.ctrlKey)
            localStorage.openTabs = JSON.stringify(tabs.tabs)
            search.blur()
          }
          return
        case 27: // escape
          ev.preventDefault()
          search.blur()
          return
      }
    }
  })
  tabs.insertBefore(search, tabs.querySelector('.hypertabs__content'))

  var saved
  try { saved = JSON.parse(localStorage.openTabs) }
  catch (_) { saved = ['/public', '/private'] }

  saved.forEach(function (path) {
    var el = screen_view(path)
    if (!el) return
    el.scroll = keyscroll(el.querySelector('.scroller__content'))
    if(el) tabs.add(path, el, true)
  })

  tabs.select(saved[0] || '/public')

  tabs.onclick = function (ev) {
    var link = ancestor(ev.target)
    if(!link) return
    var path = link.hash.substring(1)

    ev.preventDefault()
    ev.stopPropagation()

    //open external links.
    //this ought to be made into something more runcible
    if(/^https?/.test(link.href)) return openExternal(link.href)

    if(tabs.has(path)) return tabs.select(path)
    
    var el = screen_view(path)
    if(el) {
      el.scroll = keyscroll(el.querySelector('.scroller__content'))
      tabs.add(path, el, !ev.ctrlKey)
      localStorage.openTabs = JSON.stringify(tabs.tabs)
    }
  }

  window.addEventListener('keydown', function (ev) {
    if (ev.target.nodeName === 'INPUT' || ev.target.nodeName === 'TEXTAREA')
      return
    switch(ev.keyCode) {

      // scroll through tabs
      case 72: // h
        return tabs.selectRelative(-1)
      case 76: // l
        return tabs.selectRelative(1)

      // scroll through messages
      case 74: // j
        return tabs.selectedTab.scroll(1)
      case 75: // k
        return tabs.selectedTab.scroll(-1)

      // close a tab
      case 88: // x
        if (tabs.selected !== '/public' && tabs.selected !== '/private') {
          tabs.remove(tabs.selected)
          localStorage.openTabs = JSON.stringify(tabs.tabs)
        }
        return

      // activate the search field
      case 191: // /
        ev.preventDefault()
        search.focus()
        search.selectionStart = 0
        search.selectionEnd = search.value.length
        return
    }
  })

  return tabs
}












