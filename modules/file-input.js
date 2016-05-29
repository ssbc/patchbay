var u = require('../util')
var h = require('hyperscript')
var pull = require('pull-stream')
var mime = require('mime-types')
var split = require('split-buffer')

function first(plug) {
  return function () {
    var args = [].slice.call(arguments)
    args.unshift(plug)
    return u.firstPlug.apply(null, args)
  }
}

var add = first(exports.sbot_blobs_add = [])

exports.file_input = function FileInput(onAdded) {

  return h('input', { type: 'file',
    onchange: function (ev) {
      var file = ev.target.files[0]
      var reader = new FileReader()
      reader.onload = function () {
        pull(
          pull.values(split(new Buffer(reader.result), 64*1024)),
          add(function (err, blob) {
            if(err) return console.error(err)
            onAdded({
              link: blob,
              name: file.name,
              size: reader.result.length || reader.result.byteLength,
              type: mime.contentType(file.name)
            })

          })
        )
      }
      reader.readAsArrayBuffer(file)
    }
  })
}




