var h = require('hyperscript')
var pull = require('pull-stream')
var mime = require('simple-mime')('application/octect-stream')
var split = require('split-buffer')

exports.needs =  {
  sbot: { blobs_add: 'first' }
}

exports.gives = 'file_input'

exports.create = function (api) {
  return function FileInput(onAdded) {
    return h('input', { type: 'file',
      onchange: function (ev) {
        var file = ev.target.files[0]
        if (!file) return
        var reader = new FileReader()
        reader.onload = function () {
          pull(
            pull.values(split(new Buffer(reader.result), 64*1024)),
            api.sbot.blobs_add(function (err, blob) {
              if(err) return console.error(err)
              onAdded({
                link: blob,
                name: file.name,
                size: reader.result.length || reader.result.byteLength,
                type: mime(file.name)
              })

            })
          )
        }
        reader.readAsArrayBuffer(file)
      }
    })
  }
}

