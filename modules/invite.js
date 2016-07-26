
var ref = require('ssb-ref')
var ssbClient = require('ssb-client')
var id = require('../keys').id
var h = require('hyperscript')

var Progress = require('hyperprogress')

var plugs = require('../plugs')
var sbot_publish = plugs.first(exports.sbot_publish = [])


//check that invite is 
// ws:...~shs:key:seed
function parseMultiServerInvite (invite) {
  var parts = invite.split('~')
  .map(function (e) { return e.split(':') })

  if(parts.length !== 2) return null
  if(!/^(net|wss?)$/.test(parts[0][0])) return null
  if(parts[1][0] !== 'shs') return null
  if(parts[1].length !== 3) return null
  var p2 = invite.split(':')
  p2.pop()

  return {
    invite: invite,
    remote: p2.join(':'),
  }
}

exports.screen_view = function (invite) {

  var data = parseMultiServerInvite(invite)
  if(!data) return

  var progress = Progress(4)

  //connect to server
  //request follow
  //post pub announce
  //post follow pub
  var div = h('div.column',
    h('div',
      "you have been invited to join:", h('br'),
      h('code', invite)
    ),
    h('button', 'accept', {onclick: attempt}),
    progress
  )

  function attempt  () {
    progress.reset().next('connecting...')

    ssbClient(null, {
      remote: invite,
      manifest: { invite: {use: 'async'}, getAddress: 'async' }
    }, function (err, sbot) {
      if(err) return progress.fail(err)
      progress.next('requesting follow...')

      sbot.invite.use({feed: id}, function (err, msg) {
        if(err) return progress.fail(err)
        progress.next('following...')

        //remove the seed from the shs address.
        //then it's correct address.
        //this should make the browser connect to this as remote.
        //we don't want to do this if when using this locally, though.
        if(process.title === 'browser')
          localStorage.remote = data.remote

        sbot_publish({
          type: 'contact',
          contact: sbot.id,
          following: true,
        }, function (err) {
          if(err) return progress.fail(err)
          progress.complete()
          //check for redirect
          var parts = location.hash.substring(1).split('#')
          //TODO: handle in a consistent way with either hashrouting
          //or with tabs...
          if(parts[0] === invite) location.hash = '#'
        })
      })
    })
  }

  // If we are in the browser,
  // and do not already have a remote set, automatically trigger the invite.

  if(process.title == 'browser' && !localStorage.remote) attempt()

  return div
}





