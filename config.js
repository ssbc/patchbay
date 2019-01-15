const nest = require('depnest')
const Config = require('ssb-config/inject')
const ssbKeys = require('ssb-keys')
const Path = require('path')
const merge = require('lodash/merge')
// settings not available in api yet, so we need to load it manually
const settings = require('patch-settings').patchSettings

const appName = process.env.ssb_appname || 'ssb'
const opts = appName === 'ssb' ? null : null

exports.gives = nest('config.sync.load')
exports.create = (api) => {
  var config
  return nest('config.sync.load', () => {
    if (config) return config

    console.log('LOADING config')
    config = Config(appName, opts)
    config.keys = ssbKeys.loadOrCreateSync(Path.join(config.path, 'secret'))

    config = merge(
      config,
      Connections(config),
      Remote(config)
    )

    let pubHopConnections = settings.create().settings.sync.get('patchbay.pubHopConnections', "3")
    if (pubHopConnections != "3") {
      config.friendPub = { hops: parseInt(pubHopConnections) }
      config.gossip.friends = true
      config.gossip.global = false
    }

    return config
  })
}

function Connections (config) {
  const connections = (process.platform === 'win32')
    ? undefined // this seems wrong?
    : { incoming: { unix: [{ 'scope': 'local', 'transform': 'noauth', server: true }] } }

  return connections ? { connections } : {}
}

function Remote (config) {
  const pubkey = config.keys.id.slice(1).replace(`.${config.keys.curve}`, '')
  const remote = (process.platform === 'win32')
    ? undefined // `net:127.0.0.1:${config.port}~shs:${pubkey}` // currently broken
    : `unix:${Path.join(config.path, 'socket')}:~noauth:${pubkey}`

  return remote ? { remote } : {}
}
