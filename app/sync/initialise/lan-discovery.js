const { onceTrue } = require('mutant')
const nest = require('depnest')
const pull = require('pull-stream')

exports.needs = nest({
  'sbot.obs.connection': 'first',
  'config.sync.get': 'first'
})

exports.gives = nest('app.sync.initialise')

exports.create = function (api) {
  return nest('app.sync.initialise', lanDiscovery)

  function lanDiscovery () {
    onceTrue(api.sbot.obs.connection, server => {
      const config = api.config.sync.get()
      console.log(config)
      if(config.gossip && config.gossip.local === false)
        return

      server.lan.start()

      pull(
        server.lan.discoveredPeers(),
        pull.drain((discovery) => {
          server.gossip.add(discovery.address, 'local')
        })
      )
    })
  }
}
