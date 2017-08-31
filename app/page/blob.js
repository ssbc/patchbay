const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.blob')

exports.needs = nest('blob.sync.url', 'first')

exports.create = (api) => {
  return nest('app.page.blob', blobPage)

  function blobPage (location) {
    const { blob } = location

    return h('Blob', { title: blob.slice(0, 9) + '...' }, [
      h('iframe', {
        src: api.blob.sync.url(blob),
        sandbox: ''
      })
    ])
  }
}
