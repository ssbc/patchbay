var h = require('hyperscript')
var u = require('../util')
var pull = require('pull-stream')
var Scroller = require('pull-scroll')

// from ssb-ref
var refRegex = /((?:@|%|&)[A-Za-z0-9\/+]{43}=\.[\w\d]+)/g

exports.gives = 'message_meta'

function linkify (text) {
  var arr = text.split(refRegex)
  for (var i = 1; i < arr.length; i += 2) {
    arr[i] = h('a', {href: '#' + arr[i]}, arr[i])
  }
  return arr
}

exports.create = function (api) {
  return function (msg) {
    var tmp = h('div')
    var el
    var pre
    return h('input', {
      type: 'checkbox',
      title: 'View Data',
      onclick: function () {
        // HACK (mw) yo we need a better way to replace the content
        var msgEl = this.parentNode.parentNode
        var msgContentEl = msgEl.querySelector('.\\.content')
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
}

