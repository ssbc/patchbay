var isVisible = require('is-visible').isVisible
var h = require('hyperscript')
var plugs = require('../plugs')

var avatar = plugs.first(exports.avatar = [])
var sbot_gossip_peers = plugs.first(exports.sbot_gossip_peers = [])
//sbot_gossip_connect
//sbot_gossip_add

var human = require('human-time')

function legacyToMultiServer(addr) {
  return 'net:'+addr.host + ':'+addr.port + '~shs:'+addr.key.substring(1).replace('.ed25519','')
}

exports.menu_items = function () {
  return h('a', {href: '#/network'}, '/network')
}

exports.screen_view = function (path) {

  if(path !== '/network') return

  var ol = h('ol.network')

  var states = {
    connected: 3,
    connecting: 2,
    disconnecting: 1
  }

  ;(function poll () {

    //if this tab isn't open, don't update.
    //todo: make a better way to do this...
    if(!isVisible(ol))
      return setTimeout(poll, 1000)

    sbot_gossip_peers(function (err, list) {
      ol.innerHTML = ''
      list.sort(function (a, b) {
        return (states[b.state] || 0) - (states[a.state] || 0) || b.stateChange - a.stateChange
      }).forEach(function (peer) {
        ol.appendChild(h('li',
          avatar(peer.key, 'thumbnail'),
          h('div',
            peer.state || 'not connected',
            ' ',
            h('label',
              {title: new Date(peer.stateChange).toString()},
              peer.stateChange && ('(' + human(new Date(peer.stateChange))) + ')')
            ),
            'source:'+peer.source,
            h('pre', legacyToMultiServer(peer))
          )
        )
      })

      setTimeout(poll, 5000)
    })

  })()

  return h('div.column.scroll-y', ol)

}












