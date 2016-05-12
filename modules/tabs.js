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
    return u.first(exports.screen_view, function (fn) {
      return fn(path, sbot)
    })
  }

  var tabs = Tabs()
  var main = screen('/')
  if(main) tabs.add('main', main, true)

  tabs.onclick = function (ev) {
    var link = ancestor(ev.target)
    var path = link.hash.substring(1)

    ev.preventDefault()
    ev.stopPropagation()

    if(tabs.has(path)) return tabs.select(path)

    var el = screen(path)
    if(el) tabs.add(path, el, !ev.ctrlKey)

  }

  return tabs
}

exports.message_render = []
exports.screen_view = []








