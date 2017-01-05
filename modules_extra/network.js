var isVisible = require('is-visible').isVisible
var h = require('../h')

//var avatar = plugs.first(exports.avatar = [])
//var sbot_gossip_peers = plugs.first(exports.sbot_gossip_peers = [])
//var sbot_gossip_connect = plugs.first(exports.sbot_gossip_connect = [])

exports.needs = {
  avatar: 'first',
  sbot_gossip_peers: 'first',
  sbot_gossip_connect: 'first'
}

exports.gives = {
  menu_items: true,
  builtin_tabs: true,
  screen_view: true
}

//sbot_gossip_connect
//sbot_gossip_add

var human = require('human-time')

function legacyToMultiServer(addr) {
  return 'net:'+addr.host + ':'+addr.port + '~shs:'+addr.key.substring(1).replace('.ed25519','')
}



//on the same wifi network
function isLocal (e) {
  // don't rely on private ip address, because
  // cjdns creates fake private ip addresses.
  return ip.isPrivate(e.host) && e.type === 'local'
}


//pub is running scuttlebot >=8
//have connected successfully.
function isLongterm (e) {
  return e.ping && e.ping.rtt && e.ping.rtt.mean > 0
}

//pub is running scuttlebot < 8
//have connected sucessfully
function isLegacy (peer) {
  return /connect/.test(peer.state) || (peer.duration && peer.duration.mean) > 0 && !isLongterm(peer)
}

//tried to connect, but failed.
function isInactive (e) {
  return e.stateChange && (e.duration && e.duration.mean == 0)
}

//havn't tried to connect peer yet.
function isUnattempted (e) {
  return !e.stateChange
}

function getType (e) {
  return (
      isLongterm(e)    ? 'modern'
    : isLegacy(e)      ? 'legacy'
    : isInactive(e)    ? 'inactive'
    : isUnattempted(e) ? 'unattempted'
    :                    'other' //should never happen
  )
}

function origin (e) {
  return e.source === 'local' ? 0 : 1
}


function round(n) {
  return Math.round(n*100)/100
}

function duration (s) {
  if(!s) return s
  if (Math.abs(s) > 30000)
    return round(s/60000)+'m'
  else if (Math.abs(s) > 500)
    return round(s/1000)+'s'
  else
    return round(s)+'ms'
}

function peerListSort (a, b) {
  var states = {
    connected: 3,
    connecting: 2
  }

  //types of peers
  var types = {
    modern: 4,
    legacy: 3,
    inactive: 2,
    unattempted: 1,
    other: 0
  }

  return (
    (states[b.state] || 0) - (states[a.state] || 0)
    || origin(b) - origin(a)
    || types[getType(b)] - types[getType(a)]
    || b.stateChange - a.stateChange
  )
}


exports.create = function (api) {

  return {
    menu_items: () => h('a', {href: '#/network'}, '/network'),
    builtin_tabs: () => ['/network'],
    screen_view
  }
  
  function screen_view (path) {
    if (path !== '/network') return

    var ol = h('ul', { className: 'network' })

    ;(function poll () {

      //if this tab isn't open, don't update.
      //todo: make a better way to do this...
      if (!isVisible(ol)) return setTimeout(poll, 1000)

      api.sbot_gossip_peers((err, list) => {
        ol.innerHTML = ''
        list.sort(peerListSort).forEach(peer => {
          ol.appendChild(h('div', [
            api.avatar(peer.key, 'thumbnail'),
            h('div', [
              peer.state || 'not connected',
              ' ',
              getType(peer),
              ' ',
              //TODO: show nicer details, with labels. etc.
              (peer.ping && peer.ping.rtt) ? duration(peer.ping.rtt.mean) : '',
              ' ',
              (peer.ping && peer.ping.skew) ? duration(peer.ping.skew.mean) : '',
              h('label', 
                { title: new Date(peer.stateChange).toString() },
                peer.stateChange && ('(' + human(new Date(peer.stateChange))) + ')'
              )
            ]),
            'source:'+peer.source,
            h('pre', legacyToMultiServer(peer)),
            h('button', {
              'ev-click': () => {
                api.sbot_gossip_connect(peer, (err) => {
                  if(err) console.error(err)
                  else console.log('connected to', peer)
                })
              }},
              'connect'
            )
          ]))
        })

        setTimeout(poll, 5000)
      })

    })()

    return h('div', { className: 'column scroll-y' }, ol)
  }
}

