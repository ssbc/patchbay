var h = require('hyperscript')
var ref = require('ssb-ref')

var plugs = require('../plugs')
var blob_url = plugs.first(exports.blob_url = [])

exports.screen_view = function (path) {
  if(ref.isBlob(path)) return blob_view(path)
}

function blob_view(id) {
  return h('iframe', {
    src: blob_url(id),
    sandbox: '',
    style: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      border: 0,
    }
  })
}

