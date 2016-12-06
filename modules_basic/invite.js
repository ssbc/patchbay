
var ref = require('ssb-ref')
var ssbClient = require('ssb-client')
var id = require('../keys').id
var h = require('hyperscript')

var Progress = require('hyperprogress')

var plugs = require('../plugs')
var sbot_publish = plugs.first(exports.sbot_publish = [])
var sbot_gossip_connect = plugs.first(exports.sbot_gossip_connect = [])
var follower_of = plugs.first(exports.follower_of = [])

exports.invite_parse = function (invite) {
  return ref.parseInvite(invite)
}

exports.invite_accept = function (invite, onProgress, cb) {
  var data = exports.invite_parse(invite)
  if(!data) return cb(new Error('not a valid invite code:' + invite))

  onProgress('connecting...')
  
  sbot_gossip_connect(data.remote, function (err) {
    if(err) console.log(err)
  })

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

  var data = ref.parseInvite(invite)
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
        location.hash = ''
      else
        console.log("NO REDIRECT")
    })
  }

  // If we are in the browser,
  // and do not already have a remote set, automatically trigger the invite.
  if(process.title == 'browser' && !localStorage.remote) attempt()

  return div
}





