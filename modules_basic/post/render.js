var h = require('hyperscript')

//render a message

exports.needs = {
  message: { link: 'first' },
  helpers: { markdown: 'first' }
}

exports.gives = {
  message: {
    content: true,
    title: true
  }
}

exports.create = function (api) {
  return {
    message: {
      content,
      title
    }
  }

  function content (data) {
    if(!data.value.content || !data.value.content.text) return

    return h('div',
      api.helpers.markdown(data.value.content)
    )
  }

  function title (data) {
    var root = data.value.content && data.value.content.root
    return !root ? null : h('span', 're: ', api.message.link(root))
  }
}













