const fs = require('fs')
const h = require('../h')
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
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function screen_view (path) {
    if(!ref.isBlob(path)) return 
    
    return h('Blob', { id: path, title: path.slice(0, 9) + '...' }, [
      h('iframe', {
        src: api.blob_url(path),
        sandbox: ''
      })
    ])
  }
}

