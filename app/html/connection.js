const nest = require('depnest')
const { h, Value, computed } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.html.connection')

exports.needs = nest({
  'app.html.menuItem': 'map',
  'app.sync.goTo': 'first',
  'sbot.obs.connection': 'first',
  'sbot.obs.localPeers': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = function (api) {
  var _connection

  return nest('app.html.connection', function connectionStatus () {
    if (_connection) return _connection

    const newMessageClass = NewMessageClass(api)
    const { connection, localPeers } = api.sbot.obs

    return h('Connection', computed([connection, localPeers()], (connection, localPeers) => {
      if (localPeers.length) {
        return h('i.fa.fa-user-circle-o', {
          title: 'peers on your local network!',
          'ev-click': () => api.app.sync.goTo('/network'),
          className: newMessageClass
        })
      }

      if (connection) return h('i.fa.fa-circle-thin', { className: newMessageClass })

      return h('i.fa.fa-exclamation-circle', {
        title: 'something has gone wrong, try restarting patchbay'
      })
    }))
  })
}

function NewMessageClass (api) {
  var _class = Value('')
  var timeOut

  pull(
    api.sbot.pull.stream(sbot => {
      const query = [{
        $filter: {
          timestamp: { $gt: 0 }
        }
      }, {
        $map: {
          author: ['value', 'author']
        }
      }]
      return sbot.query.read({ live: true, old: false, query })
    }),
    // pull.filter(a => a !== myKey), // could filter out my own messages
    pull.drain(m => {
      if (timeOut) return

      _class.set('-newMsg')
      timeOut = setTimeout(() => {
        _class.set('')
        timeOut = null
      }, 100)
    })
  )

  return _class
}
