const nest = require('depnest')
const merge = require('lodash/merge')
const fs = require('fs')
const { join } = require('path')

exports.gives = nest('app.sync.initialise')

exports.needs = nest({
  'settings.sync.set': 'first',
  'settings.sync.get': 'first'
})

const defaults = {
  patchbay: {
    defaultTabs: ['/posts', '/inbox', '/notifications'],
    accessibility: {
      invert: false,
      saturation: 100,
      brightness: 100,
      contrast: 100
    },
    customStyles: defaultStyles()
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

function defaultStyles () {
  // TODO add a nice little helper README / comments
  const path = join(__dirname, '../../styles/mcss/app-theme-vars.mcss')
  const styles = fs.readFileSync(path, 'utf8')
  return styles
}
