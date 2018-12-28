const nest = require('depnest')
const pull = require('pull-stream')
const { h, Value, when } = require('mutant')

exports.gives = nest('app.page.blob')

exports.needs = nest({
  'blob.sync.url': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = (api) => {
  return nest('app.page.blob', blobPage)

  function blobPage (location) {
    const { blob } = location
    const title = blob.slice(0, 9) + '...'
    const src = api.blob.sync.url(blob)

    const content = Value()
    isImage(blob, (err, isImage) => {
      if (err) return console.log(err)

      if (isImage) content.set(h('img', { src }))
      else content.set(h('iframe', { src, sandbox: '' }))
    })

    const page = h('Blob', { title }, [
      content,
      h('a', { href: api.blob.sync.url(blob), target: '_blank' }, 'Open in browser')
    ])

    return page
  }

  // helpers

  function isImage (blob, cb) {
    pull(
      api.sbot.pull.stream(server => server.blobs.get(blob)),
      pull.take(1),
      pull.collect((err, data) => {
        if (err) throw err

        // dig into the headers and get the 'magic numbers'
        // mix: I copied this from the internet, it ight be terrible!
        const arr = (new Uint8Array(data[0])).subarray(0, 4)
        var header = ''
        for (var i = 0; i < arr.length; i++) header += arr[i].toString(16)
        // console.log(header)

        switch (header) {
          case '89504e47':
            // 'image/png'
            return cb(null, true)
          case '47494638':
            // 'image/gif'
            return cb(null, true)
          case 'ffd8ffe0':
          case 'ffd8ffe1':
          case 'ffd8ffe2':
          case 'ffd8ffe3':
          case 'ffd8ffe8':
            // 'image/jpeg'
            return cb(null, true)
          case 'ffd8ffdb':
            // 'image/???'
            return cb(null, true)
          default:
            return cb(null, false)
          // type = 'unknown' // Or you can use the blob.type as fallback
        }
      })
    )
  }
}
