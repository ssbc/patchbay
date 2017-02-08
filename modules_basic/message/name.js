
function title (s) {
  var m = /^\n*([^\n]{0,40})/.exec(s)
  return m && (m[1].length == 40 ? m[1]+'...' : m[1])
}

exports.needs = {
  sbot: { get: 'first' }
}

exports.gives = {
  message: { name: true }
}

//TODO: rewrite as observable?

exports.create = function (api) {
  return {
    message: { name }
  }

  function name (id, cb) {
    api.sbot.get(id, function (err, value) {
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
}

