const nest = require('depnest')

exports.gives = nest('message.html.decorate')

exports.create = (api) => {
  return nest('message.html.decorate', function (element, { msg }) {
    element.dataset.key = msg.key
    return element
  })
}

// data.id already exists but why the fuck is it called that?
