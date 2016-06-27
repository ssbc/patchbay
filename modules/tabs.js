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

  var saved
  try { saved = JSON.parse(localStorage.openTabs) }
  catch (_) { saved = ['/public', '/private'] }

  saved.forEach(function (path) {
    var el = screen_view(path)
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
        if (tabs.selected !== '/public' && tabs.selected !== '/private')
          return tabs.remove(tabs.selected)
    }
  })

  return tabs
}












