
var ref = require('ssb-ref')
var ssbClient = require('ssb-client')
var id = require('../keys').id
var h = require('hyperscript')

exports.screen_view = function (invite) {

  //check that invite is 
  // ws:...~shs:key:seed

  var parts = invite.split('~')
  .map(function (e) { return e.split(':') })

  if(parts.length !== 2) return null
  if(!/^(net|wss?)$/.test(parts[0][0])) return null
  if(parts[1][0] !== 'shs') return null
  if(parts[1].length !== 3) return null

  //connect to server
  //request follow
  //post pub announce
  //post follow pub
  var progress = h('h1')
  var status = h('pre')
  var div = h('div',
    progress, status,
    h('a', 'accept', {href: '#', onclick: function () {
      attempt()
    }})
  )

  function attempt  () {
    progress.textContent = '*'
    status.textContent = 'connecting...'

    console.log("CONNECT", invite)
    ssbClient(null, {
      remote: invite,
      manifest: { invite: {use: 'async'}, getAddress: 'async' }
    }, function (err, sbot) {
      console.log("ERR?", err, sbot)
      if(err) {
        progress.textContent = '*!'
        status.textContent = err.stack
        return
      }
      progress.textContent = '**'
      status.textContent = 'requesting follow...' + id

      sbot.invite.use({feed: id}, function (err, msg) {
        if(err) {
          progress.textContent = '**!'
          status.textContent = err.stack
          return
        }
        progress.textContent = '***'
        status.textContent = 'following...'
          
        //remove the seed from the shs address.
        //then it's correct address.
        var p2 = invite.split(':')
        p2.pop()
        localStorage.remote = p2.join(':')

        sbot_publish({
          type: 'contact',
          contact: sbot.id,
          following: true
        }, function (err) {
          if(err) {
            progress.textContent = '***!'
            status.textContent = err.stack
            return
          }
          progress.textContent = '****'
          status.textContent = 'READY!'

        })

      })
    })
  }

  return div
}



