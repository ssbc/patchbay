
var ref = require('ssb-ref')
var ssbClient = require('ssb-client')
var id = require('../keys').id
var h = require('hyperscript')

var Progress = require('hyperprogress')

var plugs = require('../plugs')
var sbot_publish = plugs.first(exports.sbot_publish = [])



exports.screen_view = function (invite) {

  //check that invite is 
  // ws:...~shs:key:seed

  var parts = invite.split('~')
  .map(function (e) { return e.split(':') })

  if(parts.length !== 2) return null
  if(!/^(net|wss?)$/.test(parts[0][0])) return null
  if(parts[1][0] !== 'shs') return null
  if(parts[1].length !== 3) return null

  var progress = Progress(4)

  //connect to server
  //request follow
  //post pub announce
  //post follow pub
  var div = h('div',
    progress,
    h('a', 'accept', {href: '#', onclick: function (ev) {
      ev.preventDefault()
      ev.stopPropagation()
      attempt()
      return false
    }})
  )

  function attempt  () {
    progress.next('connecting...')
    ssbClient(null, {
      remote: invite,
      manifest: { invite: {use: 'async'}, getAddress: 'async' }
    }, function (err, sbot) {
      if(err) return progress.fail(err)
      else progress.next('requesting follow...')

      sbot.invite.use({feed: id}, function (err, msg) {
        if(err) return progres.fail(err)

        progress.next('following...')
          
        //remove the seed from the shs address.
        //then it's correct address.
        //this should make the browser connect to this as remote.
        //we don't want to do this if when using this locally, though.
        if(process.title === 'browser') {
          var p2 = invite.split(':')
          p2.pop()
          localStorage.remote = p2.join(':')
        }

        sbot_publish({
          type: 'contact',
          contact: sbot.id,
          following: true,
        }, function (err) {
          if(err) return progress.fail(err)
          progress.complete()
        })

      })
    })
  }

  return div
}


