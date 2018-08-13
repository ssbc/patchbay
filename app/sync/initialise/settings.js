const nest = require('depnest')
const merge = require('lodash/merge')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'settings.sync.set': 'first',
  'settings.sync.get': 'first'
})

const defaults = {
  patchbay: {
    defaultTabs: ['/public', '/inbox', '/notifications'],
    accessibility: {
      invert: false,
      saturation: 100,
      brightness: 100,
      contrast: 100
    }
  },
  filter: {
    exclude: {
      channels: ''
    },
    only: {
      peopleIFollow: false
    },
    show: {
      post: true,
      vote: false, // a.k.a. like
      about: true,
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
    settings.filter.defaults = defaults.filter

    set(settings)
  }
}
