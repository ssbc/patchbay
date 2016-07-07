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
var search_box = plugs.first(exports.search_box = [])

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
  var search
  var tabs = Tabs(function (name) {
    search.value = name
    sessionStorage.selectedTab = tabs.selected
  })
  tabs.classList.add('screen')

  search = search_box(function (path, change) {
    if(tabs.has(path)) {
      tabs.select(path)
      return true
    }
    var el = screen_view(path)
    if(el) {
      el.scroll = keyscroll(el.querySelector('.scroller__content'))
      tabs.add(path, el, change)
      localStorage.openTabs = JSON.stringify(tabs.tabs)
      return change
    }
  })

  tabs.insertBefore(search, tabs.querySelector('.hypertabs__content'))

  var saved = []
  try { saved = JSON.parse(localStorage.openTabs) }
  catch (_) { }

  if(!saved || saved.length < 2)
    saved = ['/public', '/private']

  saved.forEach(function (path) {
    var el = screen_view(path)
    if (!el) return
    el.scroll = keyscroll(el.querySelector('.scroller__content'))
    if(el) tabs.add(path, el, false)
  })

  tabs.select(sessionStorage.selectedTab || saved[0] || '/public')

  tabs.onclick = function (ev) {
    var link = ancestor(ev.target)
    if(!link) return
    var path = link.hash.substring(1)

    ev.stopPropagation()
    ev.preventDefault()

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
          var sel = tabs.selected
          tabs.selectRelative(-1)
          tabs.remove(sel)
          localStorage.openTabs = JSON.stringify(tabs.tabs)
        }
        return

      // activate the search field
      case 191: // /
        search.activate('?', ev)
        return

      // navigate to a feed
      case 50: // 2
        if (ev.shiftKey)
          search.activate('@', ev)
        return

      // navigate to a channel
      case 51: // 3
        if (ev.shiftKey)
          search.activate('#', ev)
        return
    }
  })

  // errors tab
  var errorsContent = h('div.column.scroller__content')
  var errors = h('div.column.scroller',
    {style: {'overflow':'auto'}},
    h('div.scroller__wrapper',
      errorsContent
    )
  )

  window.addEventListener('error', function (ev) {
    var err = ev.error || ev
    if(!tabs.has('errors'))
      tabs.add('errors', errors, false)
    var el = h('div.message',
      h('strong', err.message),
      h('pre', err.stack))
    if (errorsContent.firstChild)
      errorsContent.insertBefore(el, errorsContent.firstChild)
    else
      errorsContent.appendChild(el)
  })

  return tabs
}


