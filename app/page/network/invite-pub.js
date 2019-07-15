const { h, Value, resolve, onceTrue, computed } = require('mutant')
const { isInvite } = require('ssb-ref')

module.exports = function InvitePub ({ connection }) {
  const state = {
    invite: Value(),
    inviteProcessing: Value(false),
    inviteResult: Value(null)
  }

  const body = h('InvitePub', [
    h('input', {
      'placeholder': 'invite code for a remote peer (pub)',
      'ev-input': handleInviteInput
    }),
    computed([state.invite, state.inviteProcessing], (invite, processing) => {
      if (processing) return h('i.fa.fa-spinner.fa-pulse')
      if (invite) return h('button -primary', { 'ev-click': useInvite }, 'use invite')

      return h('button', { disabled: 'disabled', title: 'not a valid invite code' }, 'use invite')
    }),
    computed(state.inviteResult, result => {
      if (result === null) return

      return result
        ? h('i.fa.fa-check')
        : h('i.fa.fa-times')
    })
  ])

  function handleInviteInput (ev) {
    state.inviteResult.set(null)
    const invite = ev.target.value.replace(/^\s*"?/, '').replace(/"?\s*$/, '')
    if (!isInvite(invite)) {
      state.invite.set()
      return
    }

    ev.target.value = invite
    state.invite.set(invite)
  }

  function useInvite () {
    state.inviteProcessing.set(true)

    onceTrue(connection, server => {
      server.invite.accept(resolve(state.invite), (err, data) => {
        state.inviteProcessing.set(false)
        state.invite.set()

        if (err) {
          state.inviteResult.set(false)
          console.error(err)
          return
        }
        state.inviteResult.set(true)
        console.log(data)
      })
    })
  }

  return {
    title: 'pub invites (classic)',
    body
  }
}
