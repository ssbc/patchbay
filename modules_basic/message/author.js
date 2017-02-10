const fs = require('fs')
const h = require('../../h')
const { when }= require('mutant')

exports.needs = {
  about: {
    link: 'first',
    image: 'first',
    name: 'first'
  },
  helpers: { timestamp: 'first' }
}

exports.gives = {
  message: { author: true }
}

exports.create = function (api) {
  return {
    message: { author }
  }

  function author (msg, opts = {}) {
    var { size = 'small' } = opts
    var { value } = msg
    var { author } = value

    return h('MessageAuthor', {
      className: `-${size}`
    }, [
      when(size !== 'mini',
        h('section -image', api.about.link(author, api.about.image(author, 'thumbnail')))
      ),
      h('section -name', api.about.link(author, api.about.name(author))),
      h('section -timestamp', api.helpers.timestamp(msg))
    ])
  }
}
