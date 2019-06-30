const { h, Value, resolve, onceTrue, computed } = require('mutant')
// const { isInvite } = require('ssb-ref')

function isInvite (code) {
  return typeof code === 'string' && code.length > 32
  // TODO find actual peer-invite validator!
}

module.exports = function InvitePeer ({ connection }) {
  const state = {
    use: {
      invite: Value(),
      processing: Value(false),
      result: Value(null)
    },
    create : {
      processing: Value(false),
      result: Value(false)
    }
  }

  const body = h('InvitePeer', [
    h('div.use', [
      h('input', {
        'placeholder': 'peer invite code',
        'ev-input': handleInviteCode
      }),
      computed([state.use.invite, state.use.processing], (invite, processing) => {
        if (processing) return h('i.fa.fa-spinner.fa-pulse')
        if (invite) return h('button -primary', { 'ev-click': useInvite }, 'use invite')

        return h('button', { disabled: 'disabled', title: 'not a valid invite code' }, 'use invite')
      }),
      computed(state.use.result, result => {
        if (result === null) return

        return result
          ? h('i.fa.fa-check')
          : h('i.fa.fa-times')
      })
    ]),
    h('div.create', [
    ])
  ])

  function handleInviteCode (ev) {
    state.use.result.set(null)
    const invite = ev.target.value.replace(/^\s*"?/, '').replace(/"?\s*$/, '')
    if (!isInvite(invite)) {
      state.use.invite.set()
      return
    }

    ev.target.value = invite
    state.use.invite.set(invite)
  }

  function useInvite () {
    state.use.processing.set(true)

    onceTrue(connection, server => {
      // TODO use peerInvites
      server.invite.accept(resolve(state.invite), (err, data) => {
        state.inviteProcessing.set(false)
        state.invite.set()

        if (err) {
          state.use.result.set(false)
          console.error(err)
          return
        }
        state.use.result.set(true)
        console.log(data)
      })
    })
  }

  return {
    title: 'pub invites (classic)',
    body
  }
}
