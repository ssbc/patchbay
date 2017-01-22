const h = require('../h')
const mcss = require('../mcss')(__filename)
const ref = require('ssb-ref')

exports.needs = {
  blob_url: 'first'
}

exports.gives = {
  'screen_view': true,
  'mcss': true
}

exports.create = (api) => {
  return {
    screen_view,
    mcss
  }

  function screen_view (path) {
    if(!ref.isBlob(path)) return 
    
    return h('Blob', [
      h('iframe', {
        src: api.blob_url(path),
        sandbox: ''
      })
    ])
  }
}

