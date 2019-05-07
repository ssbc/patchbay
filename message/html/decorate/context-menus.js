const nest = require('depnest')

exports.gives = nest('message.html.decorate')

exports.create = (api) => {
  return nest('message.html.decorate', function (element, { msg }) {
    // accessed from app/sync/initialise/electron-context-menu-and-spellcheck.js
    element.msg = { key: msg.key }
    return element
  })
}
