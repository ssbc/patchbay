const compile = require('micro-css')
const fs = require('fs')
const Path = require('path')

module.exports = {
  gives: {
    mcss: true,
    css: true,
    styles: true
  },
  needs: {
    mcss: 'map',
    css: 'map'
  },
  create: function (api) {
    var styles = ''
    process.nextTick(function () {
      const mcss = api.mcss().join('\n')
      const css = api.css().join('\n')
      styles = coreStyle + compile(mcss) + css
    })

    return {
      styles: () => styles,
      // export empty styles
      mcss: () => '',
      css: () => ''
    }
  }
}
