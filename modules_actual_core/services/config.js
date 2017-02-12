const Path = require('path')
const Config = require('ssb-config/inject')
const Keys = require('ssb-keys')

exports.gives = 'config'

exports.create = () => {
  var config
  return () => {
    // NOTE - this current does not export a config.remote
    if (!config) {
      config = Config(process.env.ssb_appname)
      const keyPath = Path.join(config.path, 'secret')
      config.keys = Keys.loadOrCreateSync(keyPath)
    }
    return config
  }
}
