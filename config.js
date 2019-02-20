const nest = require('depnest')
const Config = require('ssb-config/inject')
const Path = require('path')
const merge = require('lodash/merge')
// settings not available in api yet, so we need to load it manually
const settings = require('patch-settings').patchSettings

exports.gives = nest('config.sync.load')
exports.create = (api) => {
  var config
  return nest('config.sync.load', () => {
    if (config) return config

    console.log('LOADING config')
    config = Config(process.env.ssb_appname || 'ssb-patchbay', {
      port: 38008, // followbot port
      ws: {
        port: 38989
      },
      friends: { hops: 2 }
    })

    config = addSockets(config)
    config = fixLocalhost(config)
    config = pubHopSettings(config)
    config = torOnly(config)

    return config
  })
}

function addSockets (config) {
  if (process.platform === 'win32') return config

  const pubkey = config.keys.id.slice(1).replace(`.${config.keys.curve}`, '')
  return merge(
    config,
    {
      connections: {
        incoming: { unix: [{ scope: 'local', transform: 'noauth', server: true }] }
      },
      remote: `unix:${Path.join(config.path, 'socket')}:~noauth:${pubkey}` // overwrites
    }
  )
}

function fixLocalhost (config) {
  if (process.platform !== 'win32') return config

  // without this host defaults to :: which doesn't work on windows 10?
  config.connections.incoming.net[0].host = '127.0.0.1'
  config.connections.incoming.ws[0].host = '127.0.0.1'
  config.host = '127.0.0.1'
  return config
}

function pubHopSettings (config) {
  const pubHopAll = 3
  let pubHopConnections = settings.create().settings.sync.get('patchbay.pubHopConnections', pubHopAll)
  if (pubHopConnections === pubHopAll) return config

  return merge(
    config,
    {
      friendPub: { hops: pubHopConnections },
      gossip: {
        friends: true,
        global: false
      }
    })
}

function torOnly (config) {
  if (settings.create().settings.sync.get('patchbay.torOnly', false)) {
    config = merge(config, {
      connections: {
        outgoing: {
          'onion': [{ 'transform': 'shs' }]
        }
      }
    })

    delete config.connections.outgoing.net
    return config
  } else { return config }
}
