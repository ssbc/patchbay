const nest = require('depnest')
const Config = require('ssb-config/inject')
const ssbKeys = require('ssb-keys')
const Path = require('path')
const merge = require('lodash/merge')

const appName = process.env.ssb_appname || 'ssb'
const opts = appName === 'ssb'
  ? null
  : null // require('./default-config.json')

exports.gives = nest('config.sync.load')
exports.create = (api) => {
  var config
  return nest('config.sync.load', () => {
    if (config) return config

    console.log('LOADING config')
    config = Config(appName, opts)
    config.keys = ssbKeys.loadOrCreateSync(Path.join(config.path, 'secret'))
    config.remote = buildRemote(config)

    if (process.platform !== 'win32') {
      config = merge(config, {
        connections: {
          incoming: { unix: [{ 'scope': 'local', 'transform': 'noauth' }] }
        }
      })
    }

    return config
  })
}

function buildRemote (config) {
  const pubkey = config.keys.id.slice(1).replace(`.${config.keys.curve}`, '')

  return process.platform !== 'win32'
    ? `net:127.0.0.1:${config.port}~shs:${pubkey}`
    : `unix:${Path.join(config.path, 'socket')}:~noauth:${pubkey}`
}
