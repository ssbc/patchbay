var h = require('../../h')
var compile = require('micro-css')
var fs = require('fs')
var Path = require('path')

// TODO distribute these styles across all
// the relevant modules, not as a core style.
var coreStyle = fs.readFileSync(Path.join(__dirname, '../../style.css'))

module.exports = {
  needs: {
    mcss: 'map',
    css: 'map'
  },
  gives: {
    mcss: true,
    css: true,
    styles: true
  },
  create: function (api) {
    var styles = ''
    process.nextTick(function () {
      var mcss = api.mcss().join('\n')
      var css = api.css().join('\n')
      styles = coreStyle + compile(mcss) + css
    })
    return {
      styles: function () { return styles },
      // export empty styles
      mcss: function () { return '' },
      css: function () { return '' }
    }
  }
}
