const fs = require('fs')

module.exports = (filename) => () => {
  const mcssPath = filename.replace(/js$/, 'mcss')

  return fs.readFileSync(mcssPath, 'utf8')
}

