
exports.needs = {
  h: 'first',
  message_render: 'first'
}

exports.gives = {
  page: true
}

exports.create = function (api) {
  const { h } = api
  return {
    page
  }

  function page () {
    return h('section', Array(5).fill('~').map(m => api.message_render(m)))
  }
}

