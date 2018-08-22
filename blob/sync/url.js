const nest = require('depnest')

exports.gives = nest('blob.sync.url')

exports.create = function (api) {
  return nest('blob.sync.url', function (id) {
    if (id === undefined)  {
      console.warn('value of "undefined" was passed as a blob ID')
      return '#'
    } else {
      return 'http://localhost:8989/blobs/get/' + id
    }
  })
}
