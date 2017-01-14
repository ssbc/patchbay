const fs = require('fs')
const h = require('../../h')
const { when }= require('@mmckegg/mutant')

exports.needs = {
  avatar_link: 'first',
  avatar_image: 'first',
  avatar_name: 'first',
  timestamp: 'first'
}

exports.gives = {
  author: true,
  mcss: true
}

exports.create = function (api) {
  return {
    author,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function author (msg, opts = {}) {
    var { size = 'small' } = opts
    var { value } = msg
    var { author } = value

    return h('MessageAuthor', {
      className: `-${size}`
    }, [
      when(size !== 'mini',
        h('section -image', api.avatar_link(author, api.avatar_image(author, 'thumbnail')))
      ),
      h('section -name', api.avatar_link(author, api.avatar_name(author))),
      h('section -timestamp', api.timestamp(msg))
    ])
  }
}

