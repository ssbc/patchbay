
var sbot_get = require('../plugs').first(exports.sbot_get = [])

function title (s) {
  var m = /^\n*([^\n]{0,40})/.exec(s)
  return m && (m[1].length == 40 ? m[1]+'...' : m[1])
}

exports.message_name = function (id, cb) {
  sbot_get(id, function (err, value) {
    if(err && err.name == 'NotFoundError')
      return cb(null, id.substring(0, 10)+'...(missing)')
    if(value.content.type === 'post' && 'string' === typeof value.content.text)
      return cb(null, title(value.content.text))
    else if('string' === typeof value.content.text)
      return cb(null, value.content.type + ':'+title(value.content.text))
    else
      return cb(null, id.substring(0, 10)+'...')
  })
}

