const nest = require('depnest')
const ref = require('ssb-ref')
const { h } = require('mutant')

exports.gives = nest('app.page.blob')

exports.needs = nest('blob.sync.url', 'first')

exports.create = (api) => {
  return nest('app.page.blob', blobPage)

  function blobPage () {
    return h('Blob', { id: path, title: path.slice(0, 9) + '...' }, [
      h('iframe', {
        src: api.blob.sync.url(path),
        sandbox: ''
      })
    ])
  }
}

