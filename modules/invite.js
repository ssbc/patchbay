
var ref = require('ssb-ref')
var ssbClient = require('ssb-client')
var id = require('../keys').id
var h = require('hyperscript')

var Progress = require('hyperprogress')

var plugs = require('../plugs')
var sbot_publish = plugs.first(exports.sbot_publish = [])
var follower_of = plugs.first(exports.follower_of = [])


//check that invite is 
// ws:...~shs:key:seed
function parseMultiServerInvite (invite) {
  var redirect = invite.split('#')
  if(!redirect.length) return null

  var parts = redirect[0].split('~')
  .map(function (e) { return e.split(':') })

  if(parts.length !== 2) return null
  if(!/^(net|wss?)$/.test(parts[0][0])) return null
  if(parts[1][0] !== 'shs') return null
  if(parts[1].length !== 3) return null
  var p2 = invite.split(':')
  p2.pop()

  return {
    invite: redirect[0],
    remote: p2.join(':'),
    key: '@'+parts[1][1]+'.ed25519',
    redirect: '#' + redirect.slice(1).join('#')
  }
}

exports.invite_parse = function (invite) {
  return parseMultiServerInvite(invite)
}

exports.invite_accept = function (invite, onProgress, cb) {
  var data = exports.invite_parse(invite)
  if(!data) return cb(new Error('not a valid invite code:' + invite))

  onProgress('connecting...')

  ssbClient(null, {
    remote: data.invite,
    manifest: { invite: {use: 'async'}, getAddress: 'async' }
  }, function (err, sbot) {
    if(err) return cb(err)
    onProgress('requesting follow...')
    console.log(sbot)
    sbot.invite.use({feed: id}, function (err, msg) {

      //if they already follow us, just check we actually follow them.
      if(err) follower_of(id, data.key, function (_err, follows) {
          if(follows) cb(err)
          else next()
        })
      else next()

      function next () {
        onProgress('following...')

        //remove the seed from the shs address.
        //then it's correct address.
        //this should make the browser connect to this as remote.
        //we don't want to do this if when using this locally, though.
        if(process.title === 'browser')
          localStorage.remote = data.remote

        sbot_publish({
          type: 'contact',
          contact: data.key,
          following: true,
        }, cb)
      }
    })
  })
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
      h('code', data.invite)
    ),
    h('button', 'accept', {onclick: attempt}),
    progress
  )

  function attempt () {
    exports.invite_accept(invite, function (message) {
      progress.next(message)
    }, function (err) {
      if(err) return progress.fail(err)
      progress.complete()
      //check for redirect
      var parts = location.hash.substring(1).split('#')

      //TODO: handle in a consistent way with either hashrouting
      //or with tabs...
      if(parts[0] === data.invite)
        location.hash = data.redirect
      else
        console.log("NO REDIRECT")
    })
  }

  // If we are in the browser,
  // and do not already have a remote set, automatically trigger the invite.
  if(process.title == 'browser' && !localStorage.remote) attempt()

  return div
}

