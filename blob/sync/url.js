const nest = require('depnest')
const toUrl = require('ssb-serve-blobs/id-to-url')

exports.gives = nest('blob.sync.url')

exports.create = function (api) {
  return nest('blob.sync.url', function (id) {

    return toUrl(id)
  })
}
