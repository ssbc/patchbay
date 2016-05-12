var h = require('hyperscript')
var u = require('./util')
var pull = require('pull-stream')
var combine = require('depject')
var fs = require('fs')
var path = require('path')

var modules = fs.readdirSync(path.join(__dirname, 'modules'))
  .map(function (e) { return require('./modules/'+e) })

var renderers = []
var app = []
modules.unshift({app: app})

combine(modules)

var u = require('./util')

require('ssb-client')(function (err, sbot) {
  if(err) throw err
  document.body.appendChild(u.decorate(app, sbot))
})


