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

    const isImage = Value()
    fetchMime()

    return h('Blob', { title: blob.slice(0, 9) + '...' }, [
      when(isImage,
        h('img', { src: api.blob.sync.url(blob) }),
        h('iframe', {
          src: api.blob.sync.url(blob),
          sandbox: ''
        })
      ),
      h('a', { href: api.blob.sync.url(blob), target: '_blank' }, 'Open in browser')
    ])

    // helpers

    function fetchMime () {
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
              return isImage.set(true)
            // type = 'image/png'
            case '47494638':
              return isImage.set(true)
            // type = 'image/gif'
            case 'ffd8ffe0':
            case 'ffd8ffe1':
            case 'ffd8ffe2':
            case 'ffd8ffe3':
            case 'ffd8ffe8':
              return isImage.set(true)
            // type = 'image/jpeg'
            default:
              isImage.set(false)
            // type = 'unknown' // Or you can use the blob.type as fallback
          }
        })
      )
    }
  }
}
