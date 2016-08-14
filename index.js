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

var u = require('./util')

document.head.appendChild(h('style', require('./style.css.json')))

modules['sbot-api.js'] = SbotApi()
combine(modules)

if(process.title === 'node') {
  console.log(require('depject/graph')(modules))
  process.exit(0)
}

document.body.appendChild(modules['app.js'].app())


