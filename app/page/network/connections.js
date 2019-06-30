const { h, computed, throttle } = require('mutant')

module.exports = function Connections ({ localPeers, connectedPeers, avatar }) {
  const state = buildState({ localPeers, connectedPeers })

  return [
    {
      title: 'local peers',
      body: h('LocalPeers', [
        computed(state.localPeers, peers => {
          if (!peers.length) return h('p', 'No local peers (on same wifi/ LAN)')

          return peers.map(peer => avatar(peer))
        }),
        h('p', [
          h('i.fa.fa-info-circle'),
          'these are people on the same WiFi/ LAN as you right now. You might not know some of them yet, but you can click through to find out more about them and follow them if you like.'
        ])
      ])
    },
    {
      title: 'remote peers',
      body: h('RemotePeers', [
        computed(state.remotePeers, peers => {
          if (!peers.length) return h('p', 'No remote peers connected')

          return peers.map(peer => avatar(peer))
        }),
        h('p', [
          h('i.fa.fa-info-circle'),
          'these are people on the same WiFi/ LAN as you right now. You might not know some of them yet, but you can click through to find out more about them and follow them if you like.'
        ])
      ])

    }
  ]
}

function buildState ({ localPeers, connectedPeers }) {
  const local = throttle(localPeers(), 1000)
  const remote = computed([local, throttle(connectedPeers(), 1000)], (local, connected) => {
    return connected.filter(peer => !local.includes(peer))
  })

  return {
    localPeers: local,
    remotePeers: remote
  }
}
