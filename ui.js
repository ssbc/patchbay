var h = require('hyperscript')
var pull = require('pull-stream')
var u = require('./util')
var Scroller = require('pull-scroll')

exports.createStream = function createStream (stream, render) {
  var div = h('div.column', {style: {'overflow-y': 'auto'}})

  pull(
    stream,
    Scroller(div, div, render, false, false)
  )

  return div
}

exports.createRenderers = function (renderers, sbot) {
  return function (data) {
    return u.first(renderers, function (fn) {
      return fn(data, sbot)
    })
  }
}

