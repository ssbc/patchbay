const fs = require('fs')

module.exports = function buildMcssModule (filename) {
  return () => fs.readFileSync(filename.replace(/js$/, 'mcss'), 'utf8')
}

