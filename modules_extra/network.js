const isVisible = require('is-visible').isVisible
const h = require('../h')
const mutantMap = require('@mmckegg/mutant/map')
const mutantDict = require('@mmckegg/mutant/dict')
const Struct = require('@mmckegg/mutant/struct')
const Value = require('@mmckegg/mutant/value')
const toCollection = require('@mmckegg/mutant/dict-to-collection')
const when = require('@mmckegg/mutant/when')
const computed = require('@mmckegg/mutant/computed')
const human = require('human-time')

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


function legacyToMultiServer(addr) {
  return 'net:'+addr.host + ':'+addr.port + '~shs:'+addr.key.substring(1).replace('.ed25519','')
}



//on the same wifi network
function isLocal (peer) {
  // don't rely on private ip address, because
  // cjdns creates fake private ip addresses.
  return ip.isPrivate(peer.host) && peer.type === 'local'
}


//pub is running scuttlebot >=8
//have connected successfully.
function isLongterm (peer) {
  return peer.ping && peer.ping.rtt && peer.ping.rtt.mean > 0
}

//pub is running scuttlebot < 8
//have connected sucessfully
function isLegacy (peer) {
  return /connect/.test(peer.state) || (peer.duration && peer.duration.mean) > 0 && !isLongterm(peer)
}

//tried to connect, but failed.
function isInactive (peer) {
  return peer.stateChange && (peer.duration && peer.duration.mean == 0)
}

//havn't tried to connect peer yet.
function isUnattempted (peer) {
  return !peer.stateChange
}

function getType (peer) {
  return (
      isLongterm(peer)    ? 'modern'
    : isLegacy(peer)      ? 'legacy'
    : isInactive(peer)    ? 'inactive'
    : isUnattempted(peer) ? 'unattempted'
    :                       'other' //should never happen
  )
}

function origin (peer) {
  return peer.source === 'local' ? 0 : 1
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

function formatDate (time) {
  return new Date(time).toString() 
}

function humanDate (time) {
  return human(new Date(time)) 
}

exports.create = function (api) {

  return {
    menu_items: () => h('a', {href: '#/network'}, '/network'),
    builtin_tabs: () => ['/network'],
    screen_view
  }
  
  function screen_view (path) {
    if (path !== '/network') return

    var peers = obs_gossip_peers(api)

    return h('div', { style: {'overflow':'auto'}, className: 'column scroller' }, [ 
      h('Network', [
        mutantMap(peers, peer => {
          var { key, ping, source, state, stateChange } = peer

          console.log('ping', ping())

          return h('NetworkConnection', [
            api.avatar(key(), 'thumbnail'),
            h('div', [
              when(state, state, 'not connected'),
              ' ',
              computed(peer, getType),
              ' ',
              // //TODO: show nicer details, with labels. etc.
              computed(ping.rtt.mean, duration),
              ' ',
              computed(ping.skew.mean, duration),
              ' ',
              h('label',
                { title: computed(stateChange, formatDate) },
                [ computed(stateChange, humanDate) ]
              ) 
            ]),
            'source: ',
            source,
            h('pre', computed(peer, legacyToMultiServer)),
            h('button', {
              'ev-click': () => {
                api.sbot_gossip_connect(peer(), (err) => {
                  if(err) console.error(err)
                  else console.log('connected to', peer())
                })
              }},
              'connect'
            )
          ])
        })
      ])
    ])
  }
}

function obs_gossip_peers (api) {
  var timer = null
  var state = mutantDict({}, {
    onListen: () => {
      timer = setInterval(refresh, 5e3)
    },
    onUnlisten: () => {
      clearInterval(timer)
    }
  })

  refresh()

  return toCollection.values(state)

  function refresh () {
    api.sbot_gossip_peers((err, peers) => {
      peers.forEach(data => {
        var current = state.get(data.key)
        if (!current) {
          current = Peer()
          current.set(data)
          state.put(data.key, current)
        } else {
          current.set(data)
        }
      })
    })
  }
}

function Peer () {
  var peer = Struct({
    key: Value(),
    ping: Struct({
      rtt: Struct({
        mean: Value()
      }),
      skew: Struct({
        mean: Value()
      })
    }),
    source: Value(),
    state: Value(),
    stateChange: Value()
  })

  return peer
}

