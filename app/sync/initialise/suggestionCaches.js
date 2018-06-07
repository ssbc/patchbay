const nest = require('depnest')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'about.async.suggest': 'first',
  'channel.async.suggest': 'first'
})

exports.create = function (api) {
  return nest('app.sync.initialise', init)

  function init () {
    api.about.async.suggest()
    api.channel.async.suggest()
  }
}
