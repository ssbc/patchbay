var h = require('hyperscript')
var pull = require('pull-stream')
var combine = require('depject')
var fs = require('fs')
var path = require('path')

var modules = fs.readdirSync(path.join(__dirname, 'modules'))
  .map(function (e) { return require('./modules/'+e) })

var renderers = []
modules.unshift({message_render: renderers})

combine(modules)

var u = require('./util')

require('ssb-client')(function (err, sbot) {
  if(err) throw err
  pull(
    sbot.createLogStream({reverse: true, limit: 100}),
    pull.drain(function (data) {

      var el = u.first(renderers, function (render) {
        return render(data, sbot)
      })

      if('string' === typeof el) el = document.createTextNode(el)
      if(el) document.body.appendChild(el)
    })
  )
})






