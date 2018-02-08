const nest = require('depnest')
const get = require('lodash/get')
const { isMsg } = require('ssb-ref')

exports.gives = nest({ 'app.sync.locationId': true })

exports.create = function (api) {
  return nest('app.sync.locationId', locationId)

  function locationId (location) {
    if (typeof location === 'string') return string

    if (isMsg(location.key)) {
      location = {
        key: get(location, 'value.content.root', location.key)
      }
    }

    return JSON.stringify(location)
  }
}
