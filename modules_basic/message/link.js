var h = require('hyperscript')
var ref = require('ssb-ref')

exports.needs = {
  message: { name: 'first' }
}

exports.gives = {
  message: { link: true }
}

exports.create = function (api) {
  return {
    message: { link }
  }

  function link (id) {

    if('string' !== typeof id)
      throw new Error('link must be to message id')

    var newLink = h('a', {href: '#'+id}, id.substring(0, 10)+'...')

    if(ref.isMsg(id))
      api.message.name(id, function (err, name) {
        if(err) console.error(err)
        else newLink.textContent = name
      })

    return newLink
  }
}








