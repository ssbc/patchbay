var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

var plugs = require('../plugs')
var message_render = plugs.first(exports.message_render = [])
var message_compose = plugs.first(exports.message_compose = [])

// from ssb-ref
var refRegex = /((?:@|%|&)[A-Za-z0-9\/+]{43}=\.[\w\d]+)/g

function linkify(text) {
  var arr = text.split(refRegex)
  for (var i = 1; i < arr.length; i += 2) {
    arr[i] = h('a', {href: '#' + arr[i]}, arr[i])
  }
  return arr
}

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
        if (!pre) pre = h('pre', linkify(JSON.stringify({
          key: msg.key,
          value: msg.value
        }, 0, 2)))
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


