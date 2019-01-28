const nest = require('depnest')
const Config = require('ssb-config/inject')
const Path = require('path')
const merge = require('lodash/merge')

exports.gives = nest('config.sync.load')
exports.create = (api) => {
  var config
  return nest('config.sync.load', () => {
    if (config) return config

    console.log('LOADING config')
    config = Config(process.env.ssb_appname || 'ssb')

    config = addSockets(config)
    config = fixLocalhost(config)

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
