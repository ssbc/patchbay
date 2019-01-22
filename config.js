const nest = require('depnest')
const Config = require('ssb-config/inject')
const Path = require('path')
const merge = require('lodash/merge')

const appName = process.env.ssb_appname || 'ssb'
const opts = appName === 'ssb' ? null : null

exports.gives = nest('config.sync.load')
exports.create = (api) => {
  var config
  return nest('config.sync.load', () => {
    if (config) return config

    console.log('LOADING config')
    config = Config(appName, opts)

    config = merge(
      config,
      Connections(config),
      Remote(config)
    )

    return config
  })
}

function Connections (config) {
  const connections = (process.platform === 'win32')
    ? undefined
    : { incoming: { unix: [{ scope: 'local', transform: 'noauth', server: true }] } }

  return connections ? { connections } : {}
}

function Remote (config) {
  const pubkey = config.keys.id.slice(1).replace(`.${config.keys.curve}`, '')
  const remote = (process.platform === 'win32')
    ? undefined // `net:127.0.0.1:${config.port}~shs:${pubkey}` // currently broken
    : `unix:${Path.join(config.path, 'socket')}:~noauth:${pubkey}`

  return remote ? { remote } : {}
}
