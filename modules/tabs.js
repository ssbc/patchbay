var Tabs = require('hypertabs')
var h = require('hyperscript')
var pull = require('pull-stream')
var u = require('../util')


function ancestor (el) {
  if(!el) return
  if(el.tagName !== 'A') return ancestor(el.parentElement)
  return el
}

exports.app = function (_, sbot) {
  function screen (path) {
    return u.firstPlug(exports.screen_view, path, sbot)
  }

  var tabs = Tabs()
  tabs.classList.add('screen')
  var main = screen('/')
  if(main) tabs.add('main', main, true)

  var private = screen('/private')
  if(private) tabs.add('private', private, true)


  tabs.onclick = function (ev) {
    var link = ancestor(ev.target)
    if(!link) return
    var path = link.hash.substring(1)

    console.log(link)

    ev.preventDefault()
    ev.stopPropagation()

    //open external links.
    //this ought to be made into something more runcible
    if(/^https?/.test(link.href))
      return require('shell').openExternal(link.href)

    if(tabs.has(path)) return tabs.select(path)
    
    var el = screen(path)
    if(el) tabs.add(path, el, !ev.ctrlKey)

  }

  return tabs
}

exports.message_render = []
exports.screen_view = []




