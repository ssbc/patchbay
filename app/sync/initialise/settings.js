const nest = require('depnest')
const merge = require('lodash/merge')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'settings.sync.set': 'first',
  'settings.sync.get': 'first',
})

const defaults = {
  filter: {
    only: {
      peopleIFollow: false
    },
    show: {
      post: true,
      about: true,
      vote: false,
      contact: false,
      channel: false,
      pub: false,
      chess: false
    }
  }
}

exports.create = function (api) {
  return nest('app.sync.initialise', initialiseSettings)

  function initialiseSettings () {
    const { get, set } = api.settings.sync
    const settings = merge({}, defaults, get())

    set(settings)
  }
}

