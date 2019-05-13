const nest = require('depnest')
const fs = require('fs')
const { join } = require('path')
const { get, clone, isEqual } = require('lodash')

// This is needed to over-ride config.sync.load in patchcore.
// By baking a fresh module with the config inside it,
// we avoid a race condition around trying to set / get the config

function configModule (config) {
  var _config = {
    complete: config,
    custom: readCustomConfig(config)
  }

  function Getter (conf) {
    return function (path, fallback) {
      if (!path) return conf
      return get(conf, path, fallback)
    }
  }

  function setCustomConfig (path, arg) {
    if (!Array.isArray(path) && typeof path !== 'string') {
      const next = path
      return writeCustomConfig(next)
    }

    const next = clone(_config.custom)
    next.set(path, arg)
    writeCustomConfig(next)
  }

  return {
    configModule: {
      gives: nest({
        'config.sync.load': true,
        'config.sync.get': true,
        'config.sync.getCustom': true,
        'config.sync.setCustom': true
      }),
      create: api => nest({
        'config.sync.load': () => _config.complete,
        'config.sync.get': Getter(_config.complete),
        'config.sync.getCustom': Getter(_config.custom),
        'config.sync.setCustom': setCustomConfig
      })
    }
  }

  function readCustomConfig (config) {
    const str = fs.readFileSync(
      join(config.path, 'config'),
      'utf8'
    )
    return JSON.parse(str)
  }

  function writeCustomConfig (next) {
    if (typeof next !== 'object') throw new Error('config must be an object!')
    if (isEqual(_config.custom, next)) return
    if (get(_config.custom, 'caps.sign') !== get(next, 'caps.sign')) throw new Error('do not change the caps.sign!')

    fs.writeFile(
      join(_config.complete.path, 'config'),
      JSON.stringify(next, null, 2),
      (err) => {
        if (err) return console.error(err)

        _config.custom = next
      }
    )
  }
}

module.exports = configModule
