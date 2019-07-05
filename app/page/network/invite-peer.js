const { h, Value, resolve, onceTrue, when, computed } = require('mutant')
// const { isInvite } = require('ssb-ref')

function isInvite (code) {
  return typeof code === 'string' && code.length > 32 && code.startsWith('inv:')
  // TODO find actual peer-invite validator!
}

module.exports = function InvitePeer ({ connection }) {
  const state = {
    use: {
      invite: Value(),
      opening: Value(false),
      message: Value(null),
      accepting: Value(false),
      result: Value(null)
    },
    create: {
      input: {
        private: Value(),
        reveal: Value()
      },
      processing: Value(false),
      time: Value(),
      result: Value()
    }
  }

  const body = h('InvitePeer', [
    h('div.use', [
      h('input', {
        'placeholder': 'peer invite code',
        'ev-input': handleInput
      }),
      h('div.actions', computed(
        [state.use.invite, state.use.opening, state.use.message, state.use.accepting],
        (invite, opening, message, accepting) => {
          if (opening || accepting) {
            return [
              h('button', { disabled: 'disabled' }, [
                h('i.fa.fa-spinner.fa-pulse')
              ])
            ]
          }

          return [
            message && message.private ? h('div.private', message.private) : '',
            message && message.reveal ? h('div.private', message.reveal) : '',
            message
              ? h('button -primary', { 'ev-click': acceptInvite }, 'accept invitation')
              : invite
                ? h('button -primary', { 'ev-click': openInvite }, 'use invite')
                : h('button', { disabled: 'disabled', title: 'not a valid invite code' }, 'use invite')
          ]
        }
      )),
      computed(state.use.result, result => {
        if (result === null) return

        return result
          ? h('i.fa.fa-check')
          : h('i.fa.fa-times')
      })
    ]),
    h('div.create', [
      h('textarea.private', {
        placeholder: 'private message to your friend',
        'ev-input': (ev) => state.create.input.private.set(ev.target.value)
      }),
      h('textarea.reveal', {
        placeholder: 'an introduction message for the community',
        'ev-input': (ev) => state.create.input.reveal.set(ev.target.value)
      }),
      h('button', {
        'ev-click': createInvite,
        disabled: state.create.processing
      }, 'create peer-invite'),
      when(state.create.processing, state.create.time),
      h('pre', state.create.result)
    ])
  ])

  function createInvite () {
    state.create.processing.set(true)
    var start = Date.now()
    var SECOND = 1e3
    var MINUTE = 60 * SECOND

    onceTrue(connection, sbot => {
      var interval = setInterval(
        () => {
          const dt = Date.now() - start
          const mins = Math.floor(dt / MINUTE)
          const secs = Math.floor((dt - mins * MINUTE) / SECOND)
          state.create.time.set(`${mins} mins, ${secs} seconds`)
        },
        1e3
      )

      const opts = {
        private: resolve(state.create.input.private),
        reveal: resolve(state.create.input.reveal)
      }

      sbot.peerInvites.create(opts, (err, invite) => {
        if (err) return console.error(err)

        clearInterval(interval)
        state.create.result.set(invite)
        state.create.processing.set(false)
      })
    })
  }

  function handleInput (ev) {
    state.use.result.set(null)
    const invite = ev.target.value.replace(/^\s*"?/, '').replace(/"?\s*$/, '')

    if (!isInvite(invite)) return

    ev.target.value = invite
    state.use.invite.set(invite)
  }

  function openInvite () {
    state.use.opening.set(true)

    console.log('openInvite', resolve(state.use.invite))
    onceTrue(connection, server => {
      server.peerInvites.openInvite(resolve(state.use.invite), (err, msg, opened) => {
        state.use.opening.set(false)
        if (err) {
          state.use.result.set(false)
          console.error(err)
          return
        }

        console.log(err, msg, opened) // NOTE no opened arriving ...
        // HACK
        const m = opened || {
          private: 'kiaora gorgeous, welcome'
        }
        state.use.message.set(m)
      })
    })
  }

  function acceptInvite () {
    state.use.accepting.set(true)

    onceTrue(connection, server => {
      server.peerInvites.acceptInvite(resolve(state.use.invite), (err, confirm) => {
        state.use.accepting.set(false)
        if (err) {
          state.use.result.set(false)
          console.error(err)
          return
        }

        console.log('peerInvites.acceptInvite worked:', confirm)
        state.use.result.set(true)
      })
    })
  }

  return {
    title: 'peer invites',
    body
  }
}
