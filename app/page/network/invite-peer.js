const { h, Value, resolve, onceTrue, when, computed } = require('mutant')
// const { isInvite } = require('ssb-ref')

function isInvite (code) {
  return typeof code === 'string' &&
    code.length > 32 &&
    code.startsWith('inv:') &&
    code.endsWith('=')
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
    h('p', [
      h('i.fa.fa-warning'),
      ' BETA - peer invites are still being rolled out to pubs and tested.'
    ]),
    h('div.use', [
      h('textarea', {
        'placeholder': 'peer invite code',
        'ev-input': handleInput
      }),
      // MIX : I hate this, it's a mess. There's a state machine emerging, but I don't have time to build it right now
      computed(
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
      ),
      computed(state.use.result, result => {
        if (result === null) return

        return result
          ? h('i.fa.fa-check')
          : h('i.fa.fa-times')
      })
    ]),
    h('div.create', [
      h('p', 'make a new peer invite code:'),
      h('div.form', [
        h('div.inputs', [
          h('textarea.private', {
            placeholder: 'private message your friend will see when they open this invite',
            'ev-input': (ev) => state.create.input.private.set(ev.target.value)
          }),
          h('textarea.reveal', {
            placeholder: 'an introduction message which the community will be able to read when this invite is accepted',
            'ev-input': (ev) => state.create.input.reveal.set(ev.target.value)
          })
        ]),
        h('button', {
          'ev-click': createInvite,
          disabled: state.create.processing
        }, 'create peer-invite')
      ]),
      h('div.result', [
        when(state.create.processing, [
          'creating an peer invite takes some time.',
          h('br'),
          'time so far: ',
          state.create.time
        ]),
        when(state.create.result, h('div.code', [
          h('code', state.create.result)
        ]))
      ])
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
        SECOND
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

    onceTrue(connection, server => {
      server.peerInvites.openInvite(resolve(state.use.invite), (err, data) => {
        state.use.opening.set(false)
        if (err) {
          state.use.result.set(false)
          console.error(err)
          return
        }

        console.log(err, data) // NOTE no opened arriving ...
        // HACK
        const m = data.opened || {
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
