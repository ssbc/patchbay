const nest = require('depnest')
const get = require('lodash/get')
const { isMsg } = require('ssb-ref')

exports.gives = nest({ 'app.sync.locationId': true })

exports.create = function (api) {
  return nest('app.sync.locationId', locationId)

  function locationId (location) {
    if (typeof location === 'string') return location

    if (isMsg(location.key)) {
      // for all messages make the thread root key the 'locationId'
      const key = get(location, 'value.content.root', location.key)
      return JSON.stringify({ key })
    }

    return JSON.stringify(location)
  }
}
