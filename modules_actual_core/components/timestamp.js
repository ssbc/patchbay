exports.needs = { h: 'first' }

exports.gives = {
  message_components: true,
  // mcss: true
}

exports.create = function (api) {
  const { h } = api
  return {
    message_components
  }

  function message_components (msg) {
    return h('div', new Date(msg.value.timestamp).toString())
  }
}

