const nest = require('depnest')
const extend = require('xtend')

exports.gives = nest('message.html.render')

exports.needs = nest({
  'about.html.link': 'first',
  'message.html': {
    decorate: 'reduce',
    layout: 'first'
  }
})

exports.create = function (api) {
  return nest('message.html.render', follow)

  function follow (msg, opts) {
    if (msg.value.content.type !== 'contact') return

    const element = api.message.html.layout(msg, extend({
      content: renderContent(msg),
      layout: 'mini'
    }, opts))

    return api.message.html.decorate(element, { msg })
  }

  function renderContent (msg) {
    const { contact, following } = msg.value.content

    return [
      following ? 'followed ' : 'unfollowed ',
      api.about.html.link(contact)
    ]
  }
}

