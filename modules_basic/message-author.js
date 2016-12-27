var fs = require('fs')
var Path = require('path')
var h = require('../h')
var when = require('@mmckegg/mutant/when')

exports.needs = {
  avatar_link: 'first',
  avatar_image: 'first',
  avatar_name: 'first',
  timestamp: 'first'
}

exports.gives = {
  message_author: true,
  mcss: true
}

exports.create = function (api) {
  return {
    message_author,
    mcss: () => fs.readFileSync(Path.join(__dirname, 'message-author.mcss'))
  }

  function message_author (msg, opts = {}) {
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

