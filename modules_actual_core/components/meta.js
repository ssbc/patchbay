exports.needs = { 
  h: 'first',
  metas: 'map'
}

exports.gives = {
  message_components: true
}

exports.create = function (api) {
  const { h } = api
  return {
    message_components: metas
  }

  function metas (msg) {
    return h('div', api.metas(msg))
  }
}


