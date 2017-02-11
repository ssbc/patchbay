var h = require('../../h')

exports.gives = {
  message: { action: true }
}

exports.create = function (api) {
  return {
    message: { action }
  }

  function action (msg) {
    return h('a', { href: '#' + msg.key }, 'Reply')
  }
}

