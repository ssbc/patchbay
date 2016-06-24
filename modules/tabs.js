var Tabs = require('hypertabs')
var h = require('hyperscript')
var pull = require('pull-stream')
var u = require('../util')


function ancestor (el) {
  if(!el) return
  if(el.tagName !== 'A') return ancestor(el.parentElement)
  return el
}

var plugs = require('../plugs')
var screen_view = plugs.first(exports.screen_view = [])

exports.message_render = []

exports.app = function () {
  var tabs = Tabs()
  tabs.classList.add('screen')

  var saved
  try { saved = JSON.parse(localStorage.openTabs) }
  catch (_) { saved = ['/public', '/private'] }
  
//  var public = screen_view('/public')
//  if(public) tabs.add('public', public, true)
//
//  var private = screen_view('/private')
//  if(private) tabs.add('private', private, true)
//
  saved.forEach(function (path) {
    var el = screen_view(path)
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
//    if(/^https?/.test(link.href))
//      return require('electron').shell.openExternal(link.href)

    if(tabs.has(path)) return tabs.select(path)
    
    var el = screen_view(path)
    if(el) {
      tabs.add(path, el, !ev.ctrlKey)
      localStorage.openTabs = JSON.stringify(tabs.tabs)
    }
  }

  return tabs
}


