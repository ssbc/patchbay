var h = require('hyperscript')
var u = require('./util')
var pull = require('pull-stream')
var combine = require('depject')
var fs = require('fs')
var path = require('path')
var SbotApi = require('./sbot-api')

var modules = require('./modules')

var u = require('./util')

modules['sbot-api.js'] = SbotApi()
combine(modules)

if(process.title === 'node') {
  console.log(require('depject/graph')(modules))
  process.exit(0)
}

document.head.appendChild(
  h('style', fs.readFileSync('./style.css', 'utf8')
))

document.body.appendChild(modules['app.js'].app())

