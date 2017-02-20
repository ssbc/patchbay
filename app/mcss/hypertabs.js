const fs = require('fs')

module.exports = {
  gives: {
    mcss: true
  },
  create: function (api) {
    return {
      mcss: () => fs.readFileSync(__filename.replace(/js$/, 'mcss'), 'utf8')
    }
  }
}

