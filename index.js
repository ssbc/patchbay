const bulk = require('bulk-require')

module.exports = {
  patchbay: bulk(__dirname, [
    '!(node_modules|junk)/**/*.js'
  ])
}
