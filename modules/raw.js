var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

var plugs = require('../plugs')
var message_render = plugs.first(exports.message_render = [])
var message_compose = plugs.first(exports.message_compose = [])

exports.message_meta = function (msg) {
  var tmp = h('div')
  var el
  var pre
  return h('input', {
    type: 'checkbox',
    title: 'View Data',
    onclick: function () {
      var msgEl = this.parentNode.parentNode.parentNode
      var msgContentEl = msgEl.querySelector('.message_content')
      if (this.checked) {
        // move away the content
        while (el = msgContentEl.firstChild)
          tmp.appendChild(el)
        // show the raw stuff
        var json = JSON.stringify({key: msg.key, value: msg.value}, 0, 2)
        pre = h('pre', json)
        msgContentEl.appendChild(pre)
      } else {
        // hide the raw stuff
        msgContentEl.removeChild(pre)
        // put back the content
        while (el = tmp.firstChild)
          msgContentEl.appendChild(el)
      }
    }
  })
}


