var h = require('hyperscript')

window.addEventListener('error', function onError(e) {
  document.body.appendChild(h('div.error',
    h('h1', e.message),
    h('big', h('code', e.filename + ':' + e.lineno)),
    h('pre', e.error ? (e.error.stack || e.error.toString()) : e.toString())))
})

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

//var sv = [], screen_view = require('./plugs').first(sv)
//modules['main.js' ] = {
//  screen_view: sv,
//  app: function () {
//    return h('div.row',
//      screen_view('/public'),
//      screen_view('/private')
//    )
//  }
//}

modules['app.js'] = {app: []}

modules['sbot-api.js'] = SbotApi()

modules['tabs.js']

combine(modules) //, ['app', 'sbot'].concat(indexes) )

if(process.title === 'node') {
  console.log(require('depject/graph')(modules))
  process.exit(0)
}

document.head.appendChild(
  h('style', fs.readFileSync('./style.css', 'utf8')
))

console.log(modules['app.js'])
document.body.appendChild(h('div.screen.column', modules['app.js'].app[0]()))

