var h = require('hyperscript')
var pull = require('pull-stream')
var u = require('./util')

exports.createStream = function createStream (stream, render) {
  var div = h('div.content')

  pull(
    stream,
    pull.drain(function (data) {
      var el = render(data)
      if('string' === typeof el) el = document.createTextNode(el)
      if(el) {
        if(div.children.length)
          div.appendChild(h('hr'))
        div.appendChild(el)
      }

    })
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
