const nest = require('depnest')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'channel.async.suggest': 'first'
})

exports.create = function (api) {
  return nest('app.sync.initialise', init)

  function init () {
    // lazy load abouts on first use, can be quite heavy during startup

    setTimeout(() => api.channel.async.suggest(), 20e3)
  }
}
