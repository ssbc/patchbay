exports.needs = {
  h: 'first',
  message_components: 'map'
}

exports.gives = {
  message_render: true,
  // mcss: true
}

exports.create = function (api) {
  return {
    message_render,
  }

  function message_render (msg) {
    const { h } = api

    return h('div.Message', { 
      style: {
        border: '1px gainsboro solid',
        'border-bottom': 'none',
        padding: '1rem'
      }
    }, api.message_components(msg))

  }
}

