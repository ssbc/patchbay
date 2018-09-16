const nest = require('depnest')
const Config = require('ssb-config/inject')
const ssbKeys = require('ssb-keys')
const Path = require('path')
const merge = require('lodash/merge')
// settings not available in api yet, so we need to load it manually
const settings = require('patch-settings').patchSettings

const appName = process.env.ssb_appname || 'ssb'
const opts = appName === 'ssb'
  ? null
  : null // require('./default-config.json')

exports.gives = nest('config.sync.load')
exports.create = (api) => {
  var config
  return nest('config.sync.load', () => {
    if (!config) {
      console.log('LOADING config')
      config = Config(appName, opts)

      const keys = ssbKeys.loadOrCreateSync(Path.join(config.path, 'secret'))
      const pubkey = keys.id.slice(1).replace(`.${keys.curve}`, '')

      if (settings.create().settings.sync.get('patchbay.torOnly', false)) {
        merge(config, {
          connections: {
            outgoing: {
              "onion": [{ "transform": "shs" }]
            }
          }
        })

        delete config.connections.outgoing.net
      }

      config = merge(config, {
        connections: {
          incoming: { unix: [{ 'scope': 'local', 'transform': 'noauth' }] }
        },
        keys,
        remote: `unix:${Path.join(config.path, 'socket')}:~noauth:${pubkey}`
      })
    }
    return config
  })
}
