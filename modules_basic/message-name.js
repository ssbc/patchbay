
var sbot_get = require('../plugs').first(exports.sbot_get = [])

exports.message_name = function (id, cb) {
  sbot_get(id, function (err, value) {
    if(err && err.name == 'NotFoundError')
      return cb(null, id.substring(0, 10)+'...(missing)')
    if(value.content.type === 'post' && 'string' === typeof value.content.text)
      return cb(null, value.content.text.substring(0, 40)+'...')
    else if('string' === typeof value.content.text)
      return cb(null, value.content.type + ':'+value.content.text.substring(0, 20))
    else
      return cb(null, id.substring(0, 10)+'...')
  })
}
