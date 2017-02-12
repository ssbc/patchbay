const pull = require('pull-stream')

exports.needs = {
  h: 'first',
  message_render: 'first',
  sbot_log: 'first'
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
    const container = h('div') 

    pull(
      api.sbot_log({reverse: true, limit: 10}),
      pull.drain(msg => container.appendChild(api.message_render(msg)))
    )

    return container
  }
}

