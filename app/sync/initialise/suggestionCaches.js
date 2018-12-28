const nest = require('depnest')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'about.async.suggest': 'first',
  'channel.async.suggest': 'first'
})

exports.create = function (api) {
  return nest('app.sync.initialise', init)

  function init () {
    // lazy load abouts on first use, can be quite heavy during startup
    setTimeout(() => {
      console.log('> loading @mentions cache')
      api.about.async.suggest()
    }, 20e3)
    api.channel.async.suggest()
  }
}
