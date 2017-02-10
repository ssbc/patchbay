const fs = require('fs')
// const { isVisible } = require('is-visible')
const h = require('../../h')
const human = require('human-time')

const {
  Struct, Value, Dict,
  dictToCollection, map: mutantMap, when, computed
} = require('mutant')

exports.needs = {
  about: {
    image_link: 'first',
    name_link: 'first'
  },
  helpers: {
    build_scroller: 'first'
  },
  sbot: {
    gossip_peers: 'first',
    gossip_connect: 'first'
  }
}

exports.gives = {
  menu_items: true,
  builtin_tabs: true,
  page: true,
  mcss: true
}

function legacyToMultiServer(addr) {
  return 'net:'+addr.host + ':'+addr.port + '~shs:'+addr.key.substring(1).replace('.ed25519','')
}

//on the same wifi network
function isLocal (peer) {
  // don't rely on private ip address, because
  // cjdns creates fake private ip addresses.
  return ip.isPrivate(peer.host) && peer.type === 'local'
}


function getType (peer) {
  return (
      isLongterm(peer)    ? 'modern'
    : isLegacy(peer)      ? 'legacy'
    : isInactive(peer)    ? 'inactive'
    : isUnattempted(peer) ? 'unattempted'
    :                       'other' //should never happen
  )

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
  return human(new Date(time)).replace(/minute/, 'min').replace(/second/, 'sec')
}

exports.create = function (api) {

  return {
    menu_items: () => h('a', {href: '#/network'}, '/network'),
    builtin_tabs: () => ['/network'],
    page,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function page (path) {
    if (path !== '/network') return

    const peers = obs_gossip_peers(api)

    const network = h('Network', [
      mutantMap(peers, peer => {
        const { key, ping, source, state, stateChange } = peer
        const isConnected = computed(state, state => /^connect/.test(state))

        return h('NetworkConnection', [
          h('section.avatar', [
            api.about.image_link(key()),
          ]),
          h('section.name', [
            api.about.name_link(key()),
          ]),
          h('section.type', [
            computed(peer, getType),
          ]),
          h('section.source', [
            h('label', 'source:'),
            h('code', source)
          ]),
          h('section.state', [
            h('label', 'state:'),
            h('i', {
              className: computed(state, (state) => '-'+state)
            }),
            h('code', when(state, state, 'not connected'))
          ]),
          h('section.actions', [
            when(isConnected, null,
              h('button', {
                'ev-click': () => {
                  api.sbot.gossip_connect(peer(), (err) => {
                    if(err) console.error(err)
                    else console.log('connected to', peer())
                  })
                }},
                'connect'
              )
            )
          ]),
          h('section.time-ago', [
            h('div',
              { title: computed(stateChange, formatDate) },
              [ computed(stateChange, humanDate) ]
            )
          ]),
          h('section.ping', [
            h('div.rtt', [
              h('label', 'rtt:'),
              h('code', computed(ping.rtt.mean, duration))
            ]),
            h('div.skew', [
              h('label', 'skew:'),
              h('code', computed(ping.skew.mean, duration))
            ]),
          ]),
          h('section.address', [
            h('code', computed(peer, legacyToMultiServer))
          ])
        ])
      })
    ])

    // doesn't use the scroller, just a styling convenience
    const { container } = api.helpers.build_scroller({ prepend: network })
    return container
  }
}

function obs_gossip_peers (api) {
  var timer = null
  var state = Dict({}, {
    onListen: () => {
      timer = setInterval(refresh, 5e3)
    },
    onUnlisten: () => {
      clearInterval(timer)
    }
  })

  refresh()

  var sortedIds = computed([state], (state) => {
    return Object.keys(state).sort((a, b) => {
      return peerListSort(state[a], state[b])
    })
  })

  return mutantMap(sortedIds, state.get)

  function refresh () {
    api.sbot.gossip_peers((err, peers) => {
      peers.forEach(data => {
        var id = legacyToMultiServer(data)
        var current = state.get(id)
        if (!current) {
          current = Peer()
          current.set(data)
          state.put(id, current)
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
