const nest = require('depnest')
const ref = require('ssb-ref')
const Scroller = require('pull-scroll')
const pull = require('pull-stream')
const { h, watch } = require('mutant')

exports.gives = nest('router.html.page')

exports.needs = nest('blob.sync.url', 'first')

exports.create = (api) => {
  return nest('router.html.page', blobView)
    
  function blobView (path) {
    if (!ref.isBlob(path)) return 
    
    return h('Blob', { id: path, title: path.slice(0, 9) + '...' }, [
      h('iframe', {
        src: api.blob.sync.url(path),
        sandbox: ''
      })
    ])
  }
}

