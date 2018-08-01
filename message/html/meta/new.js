const nest = require('depnest')
const { h, onceTrue } = require('mutant')

exports.gives = nest('message.html.meta')

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  return nest('message.html.meta', newMsg)

  function newMsg (msg) {
    const el = h('i.fa', {
      style: {
        color: 'hotpink'
      },
      'ev-click': () => {
        run(server => {
          server.unread.markRead(msg.key, (err, data) => {
            if (err) return console.error(err)
            el.classList.remove('fa-star')
            el.classList.add('fa-star-o')
          })
        })
      },
      'ev-focus': () => console.log(msg.key)
    })

    run(server => {
      server.unread.isRead(msg.key, (err, isRead) => {
        if (err) console.error(err)

        if (!isRead) el.classList.add('fa-star')
      })
    })

    return el
  }

  function run (fn) {
    onceTrue(api.sbot.obs.connection, fn)
  }
}

