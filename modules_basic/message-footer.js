var fs = require('fs')
var Path = require('path')
var h = require('../h')

exports.needs = {
  message_action: 'map',
  message_link: 'first',
  message_backlinks: 'first'
}

exports.gives = {
  message_footer: true,
  mcss: true,
}

exports.create = function (api) {
  return {
    message_footer,
    mcss: () => fs.readFileSync(Path.join(__dirname, 'message-footer.mcss'))
  }

  function message_footer (msg) {
    return h('MessageFooter', [
      h('section.actions', [
        api.message_action(msg),
        h('a', {href: '#' + msg.key}, 'Reply')
      ]),
      backlinks(msg)
    ])
  }

  function backlinks (msg) {
    var links = api.message_backlinks(msg)
    var backlinksEl = h('section.backlinks')
    if(links.length) {
      backlinksEl.appendChild(h('label', [
        'backlinks:', 
        h('div', links.map(function (key) {
          return api.message_link(key)
        }))
      ]))
    }
    return backlinksEl
  }
}
