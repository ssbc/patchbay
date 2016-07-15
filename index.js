var h = require('hyperscript')
var u = require('./util')
var pull = require('pull-stream')
var combine = require('depject')
var fs = require('fs')
var path = require('path')
var SbotApi = require('./sbot-api')

var modules = require('./modules')

var renderers = []
var app = []
//var App = require('./plugs').first(app)

var u = require('./util')

//modules.unshift(SbotApi())
//modules.unshift({app: app})

//var indexes = fs.readdirSync(path.join(__dirname, 'modules'))
//var i = indexes.indexOf('index.js')
//indexes.splice(i, 1)

modules['app.js' ] = {app: app}
modules['sbot-api.js'] = SbotApi()

combine(modules) //, ['app', 'sbot'].concat(indexes) )

if(process.title === 'node') {
  console.log(require('depject/graph')(modules))
  process.exit(0)
}

document.head.appendChild(
  h('style', fs.readFileSync('./style.css', 'utf8')
))

document.body.appendChild(modules['app.js'].app[0]())

