const { h, Value, Dict, dictToCollection, onceTrue, computed } = require('mutant')

module.exports = function ReplicationOut ({ connection }) {
  const state = buildState(connection)

  const body = h('ReplicationOut', [
    // mix: hello friend, this area is a total Work In Progress. It's a mess but useful diagnostics.
    // Let's redesign and revisit it aye!
    h('div', ['My sequence: ', state.seq]),
    h('div', [
      'Replicated:',
      h('div', computed([state.seq, dictToCollection(state.replication)], (seq, replication) => {
        return replication.map(r => {
          if (!r.value.replicating) {
            return h('div', [
              h('code', r.key),
              ' no ebt data'
            ])
          }

          const { requested, sent } = r.value.replicating
          // TODO report that r.value.seq is NOT the current local value of the seq (well it's ok, just just gets out of sync)
          // const reqDiff = requested - r.value.seq
          const reqDiff = requested - seq
          const sentDiff = sent - seq

          return h('div', [
            h('code', r.key),
            ` - requested: ${requested} `,
            reqDiff === 0 ? h('i.fa.fa-check-circle-o') : `(${reqDiff})`,
            `, sent: ${sent} `,
            sentDiff === 0 ? h('i.fa.fa-check-circle-o') : `(${sentDiff})`
          ])
        })
      }))
    ])
  ])

  return {
    title: 'Outgoing Traffic',
    body
  }
}

function buildState (connection) {
  // build seq, replication (my current state, and replicated state)
  const seq = Value()
  const replication = Dict({})
  onceTrue(connection, server => {
    setInterval(() => {
      // TODO check ebt docs if this is best method
      server.ebt.peerStatus(server.id, (err, data) => {
        if (err) return console.error(err)

        seq.set(data.seq)
        for (var peer in data.peers) {
          replication.put(peer, data.peers[peer])
        }
      })
    }, 5e3)
  })

  return {
    seq,
    replication
  }
}
