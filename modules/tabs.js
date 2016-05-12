var tabs = require('tabs')
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

  var t = tabs()
  var main = screen('/')
  if(main) t.add('main', main, true)

  t.onclick = function (ev) {
    var link = ancestor(ev.target)
    EV = ev
    var path = link.hash.substring(1)
    var el = screen(path)
    if(el) t.add(path, el, !ev.ctrlKey)

    ev.preventDefault()
    ev.stopPropagation()
  }

  return t
}

exports.message_render = []
exports.screen_view = []






