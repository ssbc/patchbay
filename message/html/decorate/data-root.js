const nest = require('depnest')

exports.gives = nest('message.html.decorate')

exports.create = (api) => {
  return nest('message.html.decorate', function (element, { msg }) {
    if (msg.value.content.root) element.dataset.root = msg.value.content.root
    if (msg.value.content.about) element.dataset.root = msg.value.content.about
    return element
  })
}
