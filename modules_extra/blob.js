var h = require('hyperscript')
var ref = require('ssb-ref')

exports.gives = 'screen_view'

exports.needs = {
  blob_url: 'first'
}

exports.create = function (api) {
  return function (path) {
    if(ref.isBlob(path)) return blob_view(path)
  }

  function blob_view(id) {
    return h('iframe', {
      src: api.blob_url(id),
      sandbox: '',
      style: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        border: 0,
      }
    })
  }
}
