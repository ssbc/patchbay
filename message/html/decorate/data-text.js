const nest = require('depnest')

exports.gives = nest('message.html.decorate')

exports.create = (api) => {
  return nest('message.html.decorate', function (element, { msg }) {
    if (msg.value.content.text) element.dataset.text = msg.value.content.text
    return element
  })
}

