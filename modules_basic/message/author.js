const fs = require('fs')
const h = require('../../h')
const { when }= require('@mmckegg/mutant')

exports.needs = {
  about_link: 'first',
  about_image: 'first',
  about_name: 'first',
  timestamp: 'first'
}

exports.gives = {
  message_author: true,
  mcss: true
}

exports.create = function (api) {
  return {
    message_author,
    mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
  }

  function message_author (msg, opts = {}) {
    var { size = 'small' } = opts
    var { value } = msg
    var { author } = value

    return h('MessageAuthor', {
      className: `-${size}`
    }, [
      when(size !== 'mini',
        h('section -image', api.about_link(author, api.about_image(author, 'thumbnail')))
      ),
      h('section -name', api.about_link(author, api.about_name(author))),
      h('section -timestamp', api.timestamp(msg))
    ])
  }
}

