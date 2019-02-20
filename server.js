// formerly background-process.js
var fs = require('fs')
var Path = require('path')
var electron = require('electron')
var pull = require('pull-stream')

console.log('STARTING SBOT')

var followbot = require('followbot')
var config = require('./config').create().config.sync.load()

followbot('ssb-patchbay', {
  config,
  rootAppName: 'ssb',
  plugins: [
    require('ssb-server/plugins/master'),
    require('ssb-server/plugins/logging'),
    require('ssb-server/plugins/unix-socket'),
    require('ssb-server/plugins/no-auth'),

    require('ssb-friends'),
    require('ssb-ws'),

    require('ssb-about'),
    require('ssb-backlinks'),
    require('ssb-chess-db'),
    require('ssb-ebt'),
    require('ssb-friend-pub'),
    require('ssb-meme'),
    require('ssb-private'),
    require('ssb-query'),
    require('ssb-search'),
    require('ssb-suggest'),

    require('ssb-unread')
  ]
}, (err, sbot) => {
  if (err) throw err

  // for some reason have to delay start otherwise blank
  // setTimeout(() => {
    electron.ipcRenderer.send('server-started')
  // }, 15000)

  setInterval(() => {
    console.log(sbot.progress())
  }, 1000)
})
