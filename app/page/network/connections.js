const { h, computed, throttle } = require('mutant')

module.exports = function Connections ({ localPeers, connectedPeers, avatar }) {
  const state = buildState({ localPeers, connectedPeers })

  return [
    {
      title: 'local peers',
      body: h('LocalPeers', [
        h('div.peers', computed(state.localPeers, peers => {
          if (!peers.length) return h('p', 'No local peers (on same wifi/ LAN)')

          return peers.map(peer => avatar(peer))
        })),
        h('p', [
          h('i.fa.fa-info-circle'),
          'these are peers on the same WiFi/LAN as you right now. You might not know some of them yet, but you can click through to find out more about them and follow them if you like.'
        ])
      ])
    },
    {
      title: 'remote peers',
      body: h('RemotePeers', [
        h('div.peers', computed(state.remotePeers, peers => {
          if (!peers.length) return h('p', 'No remote peers connected')

          return peers.map(peer => avatar(peer))
        })),
        h('p', [
          h('i.fa.fa-info-circle'),
          'these are peers your\'re connecting to over the internet. You might be connected peers who you haven\'t followed (likely pubs) - this is because friends of yours might have gossiped about them, and you\'re just checking in to see if they have any news about any of your friends. If you don\'t like this, you can change it in ',
          h('a', { href: '/settings' }, '/settings'),
          ' under "replication"'
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
